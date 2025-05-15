import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onNotificationsClick: () => void;
}

export default function Header({ onNotificationsClick }: HeaderProps) {
  const { isAuthenticated } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-muted py-3 px-4">
      <div className="max-w-screen-md mx-auto flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent font-grotesk">
            vibe
          </a>
        </Link>
        
        {isAuthenticated && (
          <div className="flex items-center space-x-4">
            <button aria-label="Search" className="p-2 rounded-full hover:bg-muted transition-colors">
              <i className="ri-search-line text-xl"></i>
            </button>
            <button 
              aria-label="Notifications" 
              className="p-2 rounded-full hover:bg-muted transition-colors relative"
              onClick={onNotificationsClick}
            >
              <i className="ri-notification-3-line text-xl"></i>
              <span className="notification-dot"></span>
            </button>
            <button aria-label="Messages" className="p-2 rounded-full hover:bg-muted transition-colors">
              <i className="ri-message-3-line text-xl"></i>
            </button>
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="flex items-center space-x-2">
            <a 
              href="/api/login" 
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
