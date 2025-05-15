import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProfileActionProps {
  username: string;
}

export function PostSkeleton() {
  return (
    <div className="bg-muted rounded-xl overflow-hidden shadow-lg animate-pulse">
      <div className="p-4 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-background"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-background rounded w-1/4"></div>
          <div className="h-3 bg-background rounded w-1/5"></div>
        </div>
      </div>
      <div className="w-full aspect-[4/3] bg-background"></div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="space-x-2 flex">
            <div className="w-8 h-6 bg-background rounded"></div>
            <div className="w-8 h-6 bg-background rounded"></div>
            <div className="w-8 h-6 bg-background rounded"></div>
          </div>
          <div className="w-6 h-6 bg-background rounded"></div>
        </div>
        <div className="h-4 bg-background rounded w-full"></div>
        <div className="h-3 bg-background rounded w-3/4"></div>
      </div>
    </div>
  );
}

export default function ProfileAction({ username }: ProfileActionProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isOwnProfile = currentUser?.username === username;
  
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${username}`],
    staleTime: 60000,
  });
  
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: [`/api/users/${username}/posts`],
    staleTime: 30000,
  });
  
  const { data: savedPosts, isLoading: isLoadingSaved } = useQuery({
    queryKey: [`/api/users/${username}/saved`],
    staleTime: 30000,
    enabled: isOwnProfile,
  });
  
  const { mutate: followUser } = useMutation({
    mutationFn: async () => {
      return apiRequest(
        user?.isFollowing ? 'DELETE' : 'POST',
        `/api/users/${user?.id}/follow`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      toast({
        title: user?.isFollowing ? `Unfollowed ${username}` : `Following ${username}`,
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="px-4 flex items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-muted mr-6"></div>
          <div className="flex space-x-6">
            <div className="text-center space-y-1">
              <div className="h-5 w-10 bg-muted rounded mx-auto"></div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </div>
            <div className="text-center space-y-1">
              <div className="h-5 w-10 bg-muted rounded mx-auto"></div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </div>
            <div className="text-center space-y-1">
              <div className="h-5 w-10 bg-muted rounded mx-auto"></div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="px-4 mb-6 space-y-2">
          <div className="h-5 w-1/3 bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
        </div>
        
        <div className="px-4 mb-6">
          <div className="h-10 bg-muted rounded-lg w-full"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">User not found</h3>
        <p className="text-muted-foreground">
          The user you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="px-4 flex items-center mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden mr-6">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={`${user.username}'s profile`} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <i className="ri-user-line text-2xl"></i>
            </div>
          )}
        </div>
        
        <div className="flex space-x-6">
          <div className="text-center">
            <div className="font-semibold">{user.postsCount || 0}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold">{user.followersCount || 0}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold">{user.followingCount || 0}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </div>
      </div>
      
      <div className="px-4 mb-6">
        <h3 className="font-semibold mb-1">{user.firstName || ''} {user.lastName || ''}</h3>
        {user.bio && <p className="text-sm mb-1">{user.bio}</p>}
        {user.website && (
          <a 
            href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-accent hover:underline"
          >
            {user.website}
          </a>
        )}
      </div>
      
      <div className="px-4 mb-6">
        {isOwnProfile ? (
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        ) : (
          <Button 
            onClick={() => followUser()}
            className={`w-full ${user.isFollowing ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 border-y border-muted">
          <TabsTrigger value="posts" className="py-3">
            <i className="ri-grid-line text-xl"></i>
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="saved" className="py-3">
              <i className="ri-bookmark-line text-xl"></i>
            </TabsTrigger>
          )}
          <TabsTrigger value="tagged" className="py-3">
            <i className="ri-user-heart-line text-xl"></i>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-2">
          {isLoadingPosts ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : !userPosts || userPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-image-line text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              {isOwnProfile ? (
                <p className="text-muted-foreground">
                  Share photos and videos to start posting.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  When {user.username} shares posts, you'll see them here.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map((post) => (
                <div key={post.id} className="aspect-square overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.caption || "User post"} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="saved" className="mt-2">
            {isLoadingSaved ? (
              <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : !savedPosts || savedPosts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-bookmark-line text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No saved posts</h3>
                <p className="text-muted-foreground">
                  Save posts to view them later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {savedPosts.map((post) => (
                  <div key={post.id} className="aspect-square overflow-hidden">
                    <img 
                      src={post.imageUrl} 
                      alt={post.caption || "Saved post"} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="tagged" className="mt-2">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-heart-line text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">No tagged posts</h3>
            <p className="text-muted-foreground">
              When people tag {isOwnProfile ? 'you' : user.username} in photos, they'll appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
