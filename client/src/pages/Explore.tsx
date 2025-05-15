import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const queryClient = useQueryClient();
  
  const { data: trendingPosts, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['/api/explore/trending'],
    staleTime: 60000,
  });
  
  const { data: hashtags, isLoading: isLoadingHashtags } = useQuery({
    queryKey: ['/api/explore/hashtags'],
    staleTime: 60000,
  });
  
  const { data: suggestedUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/explore/users'],
    staleTime: 60000,
  });
  
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['/api/search', searchQuery],
    staleTime: 30000,
    enabled: searchQuery.length > 1,
  });
  
  const { mutate: followUser } = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/explore/users'] });
      if (searchQuery) {
        queryClient.invalidateQueries({ queryKey: ['/api/search', searchQuery] });
      }
    }
  });
  
  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 -mx-4 px-4 pb-3 pt-2 bg-background/80 backdrop-blur-md">
        <Input
          type="search"
          placeholder="Search people, hashtags, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-muted border-none"
          autoComplete="off"
        />
      </div>
      
      {searchQuery ? (
        // Search Results
        <div className="space-y-6">
          {isLoadingSearch ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !searchResults || (
            !searchResults.users?.length && 
            !searchResults.posts?.length && 
            !searchResults.hashtags?.length
          ) ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try searching for different keywords or usernames
              </p>
            </div>
          ) : (
            <>
              {searchResults.users && searchResults.users.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">People</h3>
                  <div className="divide-y divide-muted">
                    {searchResults.users.map((user: User) => (
                      <div key={user.id} className="flex items-center justify-between py-3">
                        <Link href={`/profile/${user.username}`} className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt={`${user.username}'s profile`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <i className="ri-user-line text-xl"></i>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </Link>
                        <Button 
                          variant={user.isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={() => followUser(user.id)}
                          className={user.isFollowing ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                        >
                          {user.isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.hashtags && searchResults.hashtags.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Hashtags</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.hashtags.map((tag) => (
                      <Link 
                        key={tag.id} 
                        href={`/explore/tags/${tag.name}`}
                        className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.posts && searchResults.posts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Posts</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {searchResults.posts.map((post) => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <a className="aspect-square overflow-hidden">
                          <img 
                            src={post.imageUrl} 
                            alt={post.caption || "Post"} 
                            className="w-full h-full object-cover" 
                          />
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Explore Tabs
        <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trending">
            {isLoadingTrending ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : !trendingPosts || trendingPosts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-fire-line text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No trending posts yet</h3>
                <p className="text-muted-foreground">
                  Check back later for trending content
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {trendingPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <a className="relative aspect-square overflow-hidden group">
                      <img 
                        src={post.imageUrl} 
                        alt={post.caption || "Trending post"} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white">
                        <div className="flex items-center">
                          <i className="ri-heart-fill mr-1"></i>
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="flex items-center">
                          <i className="ri-chat-1-fill mr-1"></i>
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="hashtags">
            {isLoadingHashtags ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !hashtags || hashtags.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-hashtag text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No trending hashtags</h3>
                <p className="text-muted-foreground">
                  Check back later for popular topics
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {hashtags.map((tag) => (
                  <Link 
                    key={tag.id} 
                    href={`/explore/tags/${tag.name}`}
                    className="bg-muted rounded-xl p-4 hover:bg-muted/80 transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-1">#{tag.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{tag.postsCount} posts</p>
                    <div className="flex -space-x-2">
                      {tag.previewImages.slice(0, 3).map((img, i) => (
                        <div key={i} className="w-8 h-8 rounded-full overflow-hidden border-2 border-background">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="people">
            {isLoadingUsers ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="w-20 h-8 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : !suggestedUsers || suggestedUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-group-line text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No suggestions yet</h3>
                <p className="text-muted-foreground">
                  We'll show you interesting people to follow soon
                </p>
              </div>
            ) : (
              <div className="divide-y divide-muted">
                {suggestedUsers.map((user: User) => (
                  <div key={user.id} className="flex items-center justify-between py-3">
                    <Link href={`/profile/${user.username}`} className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        {user.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt={`${user.username}'s profile`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <i className="ri-user-line text-xl"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.followersCount} followers
                        </div>
                      </div>
                    </Link>
                    <Button 
                      onClick={() => followUser(user.id)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
