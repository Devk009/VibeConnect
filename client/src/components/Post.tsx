import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Post as PostType } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface PostProps {
  post: PostType;
}

export default function Post({ post }: PostProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  
  const { mutate: toggleLike } = useMutation({
    mutationFn: async () => {
      return apiRequest(
        post.isLiked ? 'DELETE' : 'POST',
        `/api/posts/${post.id}/like`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', post.id] });
    }
  });
  
  const { mutate: toggleSave } = useMutation({
    mutationFn: async () => {
      return apiRequest(
        post.isSaved ? 'DELETE' : 'POST',
        `/api/posts/${post.id}/save`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', post.id] });
    }
  });

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: async () => {
      return apiRequest(
        'POST',
        `/api/posts/${post.id}/comments`,
        { content: comment }
      );
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', post.id] });
    }
  });
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addComment();
    }
  };
  
  return (
    <div className="bg-muted rounded-xl overflow-hidden shadow-lg post-card mb-6">
      <div className="p-4 flex items-center space-x-3">
        <Link href={`/profile/${post.user.username}`}>
          <a className="w-10 h-10 rounded-full overflow-hidden">
            {post.user.profileImageUrl ? (
              <img 
                src={post.user.profileImageUrl} 
                alt={`${post.user.username}'s avatar`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-background flex items-center justify-center">
                <i className="ri-user-line"></i>
              </div>
            )}
          </a>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${post.user.username}`}>
              <a className="font-semibold hover:underline">{post.user.username}</a>
            </Link>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>
          {post.location && (
            <div className="text-xs text-muted-foreground">{post.location}</div>
          )}
        </div>
        
        <button aria-label="More options" className="p-2 rounded-full hover:bg-background/50 transition">
          <i className="ri-more-fill"></i>
        </button>
      </div>
      
      <img 
        src={post.imageUrl} 
        alt={post.caption || "Post image"} 
        className="w-full h-auto aspect-[4/3] object-cover" 
      />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-4">
            <button 
              aria-label={post.isLiked ? "Unlike post" : "Like post"}
              onClick={() => toggleLike()}
              className="flex items-center space-x-1"
            >
              <i className={`${post.isLiked ? 'ri-heart-3-fill text-secondary' : 'ri-heart-3-line'} text-xl`}></i>
              <span className="text-sm">{post.likesCount}</span>
            </button>
            
            <button 
              aria-label="Comment on post"
              className="flex items-center space-x-1"
            >
              <i className="ri-chat-1-line text-xl"></i>
              <span className="text-sm">{post.commentsCount}</span>
            </button>
            
            <button 
              aria-label="Share post"
              className="flex items-center space-x-1"
            >
              <i className="ri-share-forward-line text-xl"></i>
            </button>
          </div>
          
          <button 
            aria-label={post.isSaved ? "Unsave post" : "Save post"}
            onClick={() => toggleSave()}
          >
            <i className={`${post.isSaved ? 'ri-bookmark-fill text-accent' : 'ri-bookmark-line'} text-xl`}></i>
          </button>
        </div>
        
        <div className="mb-2">
          <span className="font-semibold">{post.user.username}</span>
          <span className="ml-2">{post.caption}</span>
        </div>
        
        {post.commentsCount > 0 && (
          <div className="text-sm text-muted-foreground mb-3">
            <Link href={`/posts/${post.id}`}>
              <a className="text-muted-foreground hover:text-foreground transition-colors">
                View all {post.commentsCount} comments
              </a>
            </Link>
          </div>
        )}
        
        {post.comments && post.comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {post.comments.slice(0, 2).map(comment => (
              <div key={comment.id}>
                <span className="font-semibold text-sm">{comment.user.username}</span>
                <span className="ml-2 text-sm">{comment.content}</span>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Your profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-background flex items-center justify-center">
                <i className="ri-user-line text-sm"></i>
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-background rounded-full overflow-hidden">
            <Input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-none px-4 py-2 text-sm focus:ring-0 h-auto"
              disabled={isAddingComment}
            />
          </div>
          
          <button 
            type="submit"
            aria-label="Send comment" 
            className="text-accent"
            disabled={isAddingComment || !comment.trim()}
          >
            <i className="ri-send-plane-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
