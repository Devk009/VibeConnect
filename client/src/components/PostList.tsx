import { useQuery } from "@tanstack/react-query";
import Post from "./Post";
import { PostSkeleton } from "./ProfileAction";

export default function PostList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/posts'],
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-image-line text-2xl text-muted-foreground"></i>
        </div>
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-muted-foreground">
          Follow some users to see their posts in your feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}
