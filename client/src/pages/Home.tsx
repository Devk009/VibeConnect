import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Stories from "@/components/Stories";
import PostList from "@/components/PostList";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Show welcome toast when user logs in
    if (isAuthenticated && user && !isLoading) {
      toast({
        title: `Welcome back, ${user.firstName || user.username}!`,
        description: "Your feed is ready for you to explore.",
      });
    }
  }, [isAuthenticated, isLoading, user, toast]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-muted rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-60 bg-muted rounded-lg"></div>
          <div className="h-12 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
            Welcome to vibe
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Connect with friends, share moments, and discover what's trending in the community.
          </p>
        </div>
        
        <div className="w-full max-w-md">
          <div className="bg-muted p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Join the community</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to start sharing your moments and connecting with others.
            </p>
            <a 
              href="/api/login" 
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg text-center transition-colors"
            >
              Sign In to Get Started
            </a>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <i className="ri-user-heart-fill text-secondary text-xl"></i>
              </div>
              <h3 className="font-medium mb-1">Connect</h3>
              <p className="text-sm text-muted-foreground">Follow friends and discover new people</p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <i className="ri-image-fill text-primary text-xl"></i>
              </div>
              <h3 className="font-medium mb-1">Share</h3>
              <p className="text-sm text-muted-foreground">Post photos and videos of your moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Stories />
      <PostList />
    </>
  );
}
