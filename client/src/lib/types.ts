export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  website?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  user: User;
  postId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  caption: string;
  imageUrl: string;
  location?: string;
  user: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'tag' | 'trending';
  message: string;
  actor: User;
  postId?: string;
  postImageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
  hasViewed: boolean;
}
