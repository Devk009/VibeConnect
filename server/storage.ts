import {
  users,
  posts,
  comments,
  likes,
  saves,
  follows,
  type User,
  type UpsertUser,
  type Post,
  type Comment,
  type InsertPost,
  type InsertComment,
  type Like,
  type Save,
  type Follow,
  type Story,
  type Notification,
  type HashtagTrending,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string, currentUserId?: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: string, currentUserId: string): Promise<Post | undefined>;
  getFeedPosts(userId: string): Promise<Post[]>;
  getUserPosts(userId: string, currentUserId?: string): Promise<Post[]>;
  getSavedPosts(userId: string): Promise<Post[]>;
  getTrendingPosts(userId: string): Promise<Post[]>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Like operations
  createLike(userId: string, postId: string): Promise<Like>;
  deleteLike(userId: string, postId: string): Promise<void>;
  
  // Save operations
  savePost(userId: string, postId: string): Promise<Save>;
  unsavePost(userId: string, postId: string): Promise<void>;
  
  // Follow operations
  createFollow(followerId: string, followingId: string): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  
  // Story operations
  getStories(userId: string): Promise<Story[]>;
  
  // Explore operations
  getTrendingHashtags(): Promise<HashtagTrending[]>;
  getSuggestedUsers(userId: string): Promise<User[]>;
  
  // Search operations
  search(query: string, userId: string): Promise<{
    users: User[];
    posts: Post[];
    hashtags: HashtagTrending[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string, currentUserId?: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) return undefined;
    
    // If currentUserId is provided, check if the current user is following this user
    if (currentUserId) {
      const [isFollowing] = await db
        .select()
        .from(follows)
        .where(and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, user.id)
        ));
      
      // Get posts count
      const [postCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.userId, user.id));
      
      // Get followers count
      const [followersCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followingId, user.id));
      
      // Get following count
      const [followingCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followerId, user.id));
      
      return {
        ...user,
        isFollowing: !!isFollowing,
        postsCount: postCountResult?.count || 0,
        followersCount: followersCountResult?.count || 0,
        followingCount: followingCountResult?.count || 0,
      };
    }
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Post operations
  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    
    const user = await this.getUser(postData.userId);
    
    return {
      ...post,
      user: user!,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
    };
  }
  
  async getPost(id: string, currentUserId: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    
    if (!post) return undefined;
    
    const user = await this.getUser(post.userId);
    
    if (!user) return undefined;
    
    // Check if the current user has liked this post
    const [isLiked] = await db
      .select()
      .from(likes)
      .where(and(
        eq(likes.userId, currentUserId),
        eq(likes.postId, id)
      ));
    
    // Check if the current user has saved this post
    const [isSaved] = await db
      .select()
      .from(saves)
      .where(and(
        eq(saves.userId, currentUserId),
        eq(saves.postId, id)
      ));
    
    // Get likes count
    const [likesCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, id));
    
    // Get comments
    const commentsResult = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, id))
      .orderBy(desc(comments.createdAt))
      .limit(5);
    
    // Get comment users
    const commentUsers = await Promise.all(
      commentsResult.map(async (comment) => {
        const user = await this.getUser(comment.userId);
        return {
          ...comment,
          user: user!,
        };
      })
    );
    
    // Get comments count
    const [commentsCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, id));
    
    return {
      ...post,
      user,
      likesCount: likesCountResult?.count || 0,
      commentsCount: commentsCountResult?.count || 0,
      isLiked: !!isLiked,
      isSaved: !!isSaved,
      comments: commentUsers,
    };
  }
  
  async getFeedPosts(userId: string): Promise<Post[]> {
    // Get users that the current user follows, including themselves
    const following = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followingIds = [userId, ...following.map(f => f.id)];
    
    // Get recent posts from followed users
    const postsResult = await db
      .select()
      .from(posts)
      .where(sql`${posts.userId} IN ${followingIds}`)
      .orderBy(desc(posts.createdAt))
      .limit(20);
    
    // Enhance posts with user info, likes, comments counts, etc.
    const enhancedPosts = await Promise.all(
      postsResult.map(async (post) => {
        const postWithDetails = await this.getPost(post.id, userId);
        return postWithDetails!;
      })
    );
    
    return enhancedPosts;
  }
  
  async getUserPosts(userId: string, currentUserId?: string): Promise<Post[]> {
    const postsResult = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
    
    if (currentUserId) {
      // Enhance posts with likes, comments counts, etc.
      const enhancedPosts = await Promise.all(
        postsResult.map(async (post) => {
          const postWithDetails = await this.getPost(post.id, currentUserId);
          return postWithDetails!;
        })
      );
      
      return enhancedPosts;
    } else {
      // Just get the basic posts without user interaction details
      const user = await this.getUser(userId);
      
      return postsResult.map(post => ({
        ...post,
        user: user!,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
      }));
    }
  }
  
  async getSavedPosts(userId: string): Promise<Post[]> {
    // Get saved post IDs
    const savedPostIds = await db
      .select({ postId: saves.postId })
      .from(saves)
      .where(eq(saves.userId, userId))
      .orderBy(desc(saves.createdAt));
    
    // Get the actual posts
    const enhancedPosts = await Promise.all(
      savedPostIds.map(async ({ postId }) => {
        const postWithDetails = await this.getPost(postId, userId);
        return postWithDetails!;
      })
    );
    
    return enhancedPosts;
  }
  
  async getTrendingPosts(userId: string): Promise<Post[]> {
    // For simulation, just get posts with most likes
    const trendingPostIds = await db
      .select({ postId: likes.postId, count: sql<number>`count(*)` })
      .from(likes)
      .groupBy(likes.postId)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(12);
    
    // Get the actual posts
    const enhancedPosts = await Promise.all(
      trendingPostIds.map(async ({ postId }) => {
        const postWithDetails = await this.getPost(postId, userId);
        return postWithDetails!;
      })
    );
    
    return enhancedPosts;
  }
  
  // Comment operations
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();
    
    const user = await this.getUser(commentData.userId);
    
    return {
      ...comment,
      user: user!,
    };
  }
  
  // Like operations
  async createLike(userId: string, postId: string): Promise<Like> {
    // Check if like already exists
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(
        eq(likes.userId, userId),
        eq(likes.postId, postId)
      ));
    
    if (existingLike) {
      return existingLike;
    }
    
    const [like] = await db
      .insert(likes)
      .values({ userId, postId })
      .returning();
    
    return like;
  }
  
  async deleteLike(userId: string, postId: string): Promise<void> {
    await db
      .delete(likes)
      .where(and(
        eq(likes.userId, userId),
        eq(likes.postId, postId)
      ));
  }
  
  // Save operations
  async savePost(userId: string, postId: string): Promise<Save> {
    // Check if save already exists
    const [existingSave] = await db
      .select()
      .from(saves)
      .where(and(
        eq(saves.userId, userId),
        eq(saves.postId, postId)
      ));
    
    if (existingSave) {
      return existingSave;
    }
    
    const [save] = await db
      .insert(saves)
      .values({ userId, postId })
      .returning();
    
    return save;
  }
  
  async unsavePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(saves)
      .where(and(
        eq(saves.userId, userId),
        eq(saves.postId, postId)
      ));
  }
  
  // Follow operations
  async createFollow(followerId: string, followingId: string): Promise<Follow> {
    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    if (existingFollow) {
      return existingFollow;
    }
    
    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
    
    return follow;
  }
  
  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
  }
  
  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    // In a real app, we would fetch from a notifications table
    // Here we'll simulate some notifications
    
    // Get people who liked user's posts
    const likeNotifications: Notification[] = [];
    const userPosts = await this.getUserPosts(userId);
    
    for (const post of userPosts.slice(0, 3)) {
      const recentLikes = await db
        .select({ userId: likes.userId })
        .from(likes)
        .where(eq(likes.postId, post.id))
        .orderBy(desc(likes.createdAt))
        .limit(2);
      
      for (const like of recentLikes) {
        if (like.userId !== userId) {
          const actor = await this.getUser(like.userId);
          if (actor) {
            const [isFollowing] = await db
              .select()
              .from(follows)
              .where(and(
                eq(follows.followerId, userId),
                eq(follows.followingId, actor.id)
              ));
            
            likeNotifications.push({
              id: `like-${post.id}-${actor.id}`,
              type: 'like',
              message: 'liked your photo.',
              actor: {
                ...actor,
                isFollowing: !!isFollowing,
              },
              postId: post.id,
              postImageUrl: post.imageUrl,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    
    // Get recent followers
    const followNotifications: Notification[] = [];
    const recentFollowers = await db
      .select({ userId: follows.followerId })
      .from(follows)
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(3);
    
    for (const follower of recentFollowers) {
      if (follower.userId !== userId) {
        const actor = await this.getUser(follower.userId);
        if (actor) {
          const [isFollowing] = await db
            .select()
            .from(follows)
            .where(and(
              eq(follows.followerId, userId),
              eq(follows.followingId, actor.id)
            ));
          
          followNotifications.push({
            id: `follow-${actor.id}`,
            type: 'follow',
            message: 'started following you.',
            actor: {
              ...actor,
              isFollowing: !!isFollowing,
            },
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    
    // Get recent comments
    const commentNotifications: Notification[] = [];
    for (const post of userPosts.slice(0, 2)) {
      const recentComments = await db
        .select()
        .from(comments)
        .where(eq(comments.postId, post.id))
        .orderBy(desc(comments.createdAt))
        .limit(2);
      
      for (const comment of recentComments) {
        if (comment.userId !== userId) {
          const actor = await this.getUser(comment.userId);
          if (actor) {
            const [isFollowing] = await db
              .select()
              .from(follows)
              .where(and(
                eq(follows.followerId, userId),
                eq(follows.followingId, actor.id)
              ));
            
            commentNotifications.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              message: `commented on your post: "${comment.content.substring(0, 20)}${comment.content.length > 20 ? '...' : ''}"`,
              actor: {
                ...actor,
                isFollowing: !!isFollowing,
              },
              postId: post.id,
              postImageUrl: post.imageUrl,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    
    // Merge all notifications and sort by date
    const allNotifications = [
      ...likeNotifications,
      ...followNotifications,
      ...commentNotifications,
    ].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return allNotifications;
  }
  
  // Story operations
  async getStories(userId: string): Promise<Story[]> {
    // In a real app, we would fetch from a stories table
    // For now, we'll simulate with followed users
    
    const following = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followingIds = [...following.map(f => f.id)];
    
    const followingUsers = await Promise.all(
      followingIds.map(async (id) => {
        const user = await this.getUser(id);
        return user!;
      })
    );
    
    // Simulate stories for some followed users
    const stories: Story[] = followingUsers.slice(0, 5).map((user, index) => ({
      id: `story-${user.id}`,
      user,
      imageUrl: user.profileImageUrl || '',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hasViewed: index > 2, // Simulate some viewed, some not
    }));
    
    return stories;
  }
  
  // Explore operations
  async getTrendingHashtags(): Promise<HashtagTrending[]> {
    // In a real app, this would come from a hashtags table
    // Simulating trending hashtags
    return [
      {
        id: 'hashtag-1',
        name: 'summervibes',
        postsCount: 24569,
        previewImages: [
          'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1516542076529-1ea3854896f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        ],
      },
      {
        id: 'hashtag-2',
        name: 'musicfestival',
        postsCount: 18924,
        previewImages: [
          'https://images.unsplash.com/photo-1501612780327-45045538702b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        ],
      },
      {
        id: 'hashtag-3',
        name: 'digitalart',
        postsCount: 15738,
        previewImages: [
          'https://images.unsplash.com/photo-1516542076529-1ea3854896f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1555421689-3f034debb7a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        ],
      },
      {
        id: 'hashtag-4',
        name: 'minimalist',
        postsCount: 10246,
        previewImages: [
          'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1555421689-3f034debb7a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        ],
      },
      {
        id: 'hashtag-5',
        name: 'neonlights',
        postsCount: 8452,
        previewImages: [
          'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1501612780327-45045538702b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1527251672045-a80241b3f574?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        ],
      },
      {
        id: 'hashtag-6',
        name: 'workspace',
        postsCount: 6385,
        previewImages: [
          'https://images.unsplash.com/photo-1516542076529-1ea3854896f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
          'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        ],
      },
    ];
  }
  
  async getSuggestedUsers(userId: string): Promise<User[]> {
    // Get users that the current user is not following yet
    // In a real app, this would be more sophisticated with recommendations
    
    // First get who the user already follows
    const following = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followingIds = [...following.map(f => f.id), userId]; // Include self
    
    // Get users not in that list
    const suggestedUsers = await db
      .select()
      .from(users)
      .where(sql`${users.id} NOT IN ${followingIds}`)
      .limit(10);
    
    // Add followers count
    const enhancedUsers = await Promise.all(
      suggestedUsers.map(async (user) => {
        const [followersCountResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(follows)
          .where(eq(follows.followingId, user.id));
        
        return {
          ...user,
          followersCount: followersCountResult?.count || 0,
          isFollowing: false,
        };
      })
    );
    
    return enhancedUsers;
  }
  
  // Search operations
  async search(query: string, userId: string): Promise<{
    users: User[];
    posts: Post[];
    hashtags: HashtagTrending[];
  }> {
    // Search users by username, first name, or last name
    const usersResult = await db
      .select()
      .from(users)
      .where(or(
        ilike(users.username, `%${query}%`),
        ilike(users.firstName || '', `%${query}%`),
        ilike(users.lastName || '', `%${query}%`)
      ))
      .limit(5);
    
    // Enhance users with following info
    const enhancedUsers = await Promise.all(
      usersResult.map(async (user) => {
        const [isFollowing] = await db
          .select()
          .from(follows)
          .where(and(
            eq(follows.followerId, userId),
            eq(follows.followingId, user.id)
          ));
        
        const [followersCountResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(follows)
          .where(eq(follows.followingId, user.id));
        
        return {
          ...user,
          isFollowing: !!isFollowing,
          followersCount: followersCountResult?.count || 0,
        };
      })
    );
    
    // Search posts by caption or location
    const postsResult = await db
      .select()
      .from(posts)
      .where(or(
        ilike(posts.caption, `%${query}%`),
        ilike(posts.location || '', `%${query}%`)
      ))
      .limit(9);
    
    // Enhance posts with details
    const enhancedPosts = await Promise.all(
      postsResult.map(async (post) => {
        const postWithDetails = await this.getPost(post.id, userId);
        return postWithDetails!;
      })
    );
    
    // Search hashtags - using our simulated hashtags
    const allHashtags = await this.getTrendingHashtags();
    const matchingHashtags = allHashtags.filter(
      tag => tag.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      users: enhancedUsers,
      posts: enhancedPosts,
      hashtags: matchingHashtags,
    };
  }
}

export const storage = new DatabaseStorage();
