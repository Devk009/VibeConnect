import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/lib/types";

interface Story {
  id: string;
  user: User;
  hasStory: boolean;
  viewed: boolean;
}

export default function Stories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ["/api/stories"],
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted animate-pulse"></div>
              <div className="w-10 h-2 mt-1 rounded bg-muted animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-x-auto scrollbar-hide" ref={scrollRef}>
      <div className="flex space-x-4 pb-2">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-secondary relative">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <i className="ri-add-line text-xl text-accent"></i>
            </div>
          </div>
          <span className="text-xs mt-1 text-center">New</span>
        </div>
        
        {stories?.map((story: Story) => (
          <div key={story.id} className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full p-0.5 ${story.hasStory && !story.viewed ? 'story-gradient' : 'bg-muted'}`}>
              {story.user.profileImageUrl ? (
                <img 
                  src={story.user.profileImageUrl} 
                  alt={`${story.user.username}'s story`}
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                  <i className="ri-user-line text-lg"></i>
                </div>
              )}
            </div>
            <span className="text-xs mt-1 text-center">{story.user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
