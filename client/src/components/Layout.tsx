import { useState } from "react";
import Header from "./Header";
import NavigationBar from "./NavigationBar";
import CreatePostModal from "./CreatePostModal";
import NotificationsModal from "./NotificationsModal";
import { useModal } from "@/hooks/useModal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isOpen: isCreatePostOpen, open: openCreatePost, close: closeCreatePost } = useModal();
  const { isOpen: isNotificationsOpen, open: openNotifications, close: closeNotifications } = useModal();
  const [activeTab, setActiveTab] = useState<string>("home");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-inter antialiased">
      <Header onNotificationsClick={openNotifications} />
      
      <main className="flex-1 max-w-screen-md w-full mx-auto py-4 px-4">
        {children}
      </main>
      
      <NavigationBar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateClick={openCreatePost}
        onNotificationsClick={openNotifications}
      />
      
      <CreatePostModal isOpen={isCreatePostOpen} onClose={closeCreatePost} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={closeNotifications} />
    </div>
  );
}
