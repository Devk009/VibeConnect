import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import ProfileAction from "@/components/ProfileAction";

export default function Profile() {
  const { username } = useParams();
  const { user, isLoading } = useAuth();
  
  // If no username is provided in the URL, use the current user's username
  const profileUsername = username || user?.username;
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-muted rounded-lg mb-4"></div>
        <div className="h-12 bg-muted rounded-lg mb-4"></div>
        <div className="h-40 bg-muted rounded-lg"></div>
      </div>
    );
  }
  
  if (!isLoading && !user && !username) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-user-line text-2xl text-muted-foreground"></i>
        </div>
        <h3 className="text-lg font-medium mb-2">Not signed in</h3>
        <p className="text-muted-foreground mb-6">
          Please sign in to view your profile.
        </p>
        <a 
          href="/api/login" 
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-lg text-center transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }
  
  return (
    <div>
      {profileUsername && <ProfileAction username={profileUsername} />}
    </div>
  );
}
