import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/:username', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const user = await storage.getUserByUsername(req.params.username, currentUserId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/users/:userId/follow', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId } = req.params;
      
      const follow = await storage.createFollow(currentUserId, userId);
      res.json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:userId/follow', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId } = req.params;
      
      await storage.deleteFollow(currentUserId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/:username/posts', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { username } = req.params;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id, currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.get('/api/users/:username/saved', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { username } = req.params;
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can only view their own saved posts
      if (user.id !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const savedPosts = await storage.getSavedPosts(currentUserId);
      res.json(savedPosts);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      res.status(500).json({ message: "Failed to fetch saved posts" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const posts = await storage.getFeedPosts(currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }
      
      // Validate post data
      const postData = z.object({
        caption: z.string().min(1).max(2200),
        location: z.string().max(100).optional(),
      }).parse({
        caption: req.body.caption,
        location: req.body.location,
      });
      
      // Mock image upload - in a real app, upload to a storage service
      const imageBuffer = req.file.buffer;
      const imageUrl = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
      
      const post = await storage.createPost({
        userId: currentUserId,
        caption: postData.caption,
        imageUrl: imageUrl,
        location: postData.location,
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { postId } = req.params;
      
      const post = await storage.getPost(postId, currentUserId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { postId } = req.params;
      
      const like = await storage.createLike(currentUserId, postId);
      res.json(like);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:postId/like', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.deleteLike(currentUserId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post('/api/posts/:postId/save', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { postId } = req.params;
      
      const save = await storage.savePost(currentUserId, postId);
      res.json(save);
    } catch (error) {
      console.error("Error saving post:", error);
      res.status(500).json({ message: "Failed to save post" });
    }
  });

  app.delete('/api/posts/:postId/save', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.unsavePost(currentUserId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unsaving post:", error);
      res.status(500).json({ message: "Failed to unsave post" });
    }
  });

  app.post('/api/posts/:postId/comments', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { postId } = req.params;
      
      const commentSchema = z.object({
        content: z.string().min(1).max(1000),
      });
      
      const { content } = commentSchema.parse(req.body);
      
      const comment = await storage.createComment({
        userId: currentUserId,
        postId,
        content,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const notifications = await storage.getNotifications(currentUserId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Stories routes
  app.get('/api/stories', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const stories = await storage.getStories(currentUserId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // Explore routes
  app.get('/api/explore/trending', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const trending = await storage.getTrendingPosts(currentUserId);
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending posts:", error);
      res.status(500).json({ message: "Failed to fetch trending posts" });
    }
  });

  app.get('/api/explore/hashtags', isAuthenticated, async (req, res) => {
    try {
      const hashtags = await storage.getTrendingHashtags();
      res.json(hashtags);
    } catch (error) {
      console.error("Error fetching hashtags:", error);
      res.status(500).json({ message: "Failed to fetch hashtags" });
    }
  });

  app.get('/api/explore/users', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const users = await storage.getSuggestedUsers(currentUserId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  // Search routes
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json({ users: [], posts: [], hashtags: [] });
      }
      
      const results = await storage.search(query, currentUserId);
      res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "Failed to search" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
