import { useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface NavigationBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCreateClick: () => void;
  onNotificationsClick: () => void;
}

export default function NavigationBar({ 
  activeTab, 
  setActiveTab, 
  onCreateClick,
  onNotificationsClick
}: NavigationBarProps) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (location === "/") setActiveTab("home");
    else if (location === "/explore") setActiveTab("explore");
    else if (location.startsWith("/profile")) setActiveTab("profile");
  }, [location, setActiveTab]);
  
  useEffect(() => {
    if (!indicatorRef.current) return;
    
    let position = 0;
    if (activeTab === "home") position = 0;
    else if (activeTab === "explore") position = 1;
    else if (activeTab === "notifications") position = 3;
    else if (activeTab === "profile") position = 4;
    
    // Skip the center button when calculating position
    if (position > 2) position -= 1;
    
    indicatorRef.current.style.transform = `translateX(${position * 100}%)`;
  }, [activeTab]);

  if (!isAuthenticated) return null;
  
  return (
    <nav className="sticky bottom-0 z-40 bg-background/80 backdrop-blur-md border-t border-muted">
      <div className="max-w-screen-md mx-auto flex items-center justify-around py-3 px-4 relative">
        <div 
          ref={indicatorRef} 
          className="bg-primary h-1 rounded-full absolute top-0 left-4 nav-indicator"
          style={{ width: "20%" }}
        ></div>
        
        <Link href="/">
          <a 
            className="flex flex-col items-center space-y-1 w-16"
            onClick={() => setActiveTab("home")}
          >
            <i className={`ri-home-5-${activeTab === "home" ? "fill" : "line"} text-2xl ${activeTab === "home" ? "text-foreground" : "text-muted-foreground"}`}></i>
            <span className={`text-xs ${activeTab === "home" ? "text-foreground" : "text-muted-foreground"}`}>Home</span>
          </a>
        </Link>
        
        <Link href="/explore">
          <a 
            className="flex flex-col items-center space-y-1 w-16"
            onClick={() => setActiveTab("explore")}
          >
            <i className={`ri-compass-3-${activeTab === "explore" ? "fill" : "line"} text-2xl ${activeTab === "explore" ? "text-foreground" : "text-muted-foreground"}`}></i>
            <span className={`text-xs ${activeTab === "explore" ? "text-foreground" : "text-muted-foreground"}`}>Explore</span>
          </a>
        </Link>
        
        <div className="w-16 flex justify-center">
          <button 
            aria-label="Create new post" 
            className="floating-action-btn w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center -mt-8"
            onClick={onCreateClick}
          >
            <i className="ri-add-line text-2xl"></i>
          </button>
        </div>
        
        <button 
          aria-label="Notifications" 
          className="flex flex-col items-center space-y-1 w-16 relative"
          onClick={() => {
            setActiveTab("notifications");
            onNotificationsClick();
          }}
        >
          <i className={`ri-notification-3-${activeTab === "notifications" ? "fill" : "line"} text-2xl ${activeTab === "notifications" ? "text-foreground" : "text-muted-foreground"}`}></i>
          <span className={`text-xs ${activeTab === "notifications" ? "text-foreground" : "text-muted-foreground"}`}>Alerts</span>
          <span className="notification-dot"></span>
        </button>
        
        <Link href="/profile">
          <a 
            className="flex flex-col items-center space-y-1 w-16"
            onClick={() => setActiveTab("profile")}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl}
                  alt="Your profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <i className="ri-user-line text-sm"></i>
                </div>
              )}
            </div>
            <span className={`text-xs ${activeTab === "profile" ? "text-foreground" : "text-muted-foreground"}`}>Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
