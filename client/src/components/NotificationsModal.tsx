import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notification } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });
  
  const { mutate: followUser } = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="w-10 h-10 rounded bg-muted"></div>
                </div>
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-notification-line text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                When you get notifications, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification: Notification) => (
                <div 
                  key={notification.id} 
                  className="flex items-center p-4 hover:bg-muted/30 transition"
                  onClick={() => notification.postId && onClose()}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    {notification.actor.profileImageUrl ? (
                      <img 
                        src={notification.actor.profileImageUrl} 
                        alt={`${notification.actor.username}'s avatar`} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <i className="ri-user-line"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.actor.username}</span>
                      <span className="ml-1">{notification.message}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </p>
                  </div>
                  
                  {notification.type === 'follow' && !notification.actor.isFollowing && (
                    <Button 
                      size="sm"
                      className="bg-primary text-white text-sm px-4 py-1.5 rounded-full hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        followUser(notification.actor.id);
                      }}
                    >
                      Follow
                    </Button>
                  )}
                  
                  {notification.postId && notification.postImageUrl && (
                    <Link href={`/posts/${notification.postId}`}>
                      <a className="w-10 h-10 overflow-hidden rounded">
                        <img 
                          src={notification.postImageUrl} 
                          alt="Post thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      </a>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
