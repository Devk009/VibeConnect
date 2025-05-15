import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [step, setStep] = useState<'select' | 'caption'>('select');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const resetState = () => {
    setStep('select');
    setSelectedImage(null);
    setImagePreview(null);
    setCaption("");
    setLocation("");
  };
  
  const handleClose = () => {
    resetState();
    onClose();
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setStep('caption');
    }
  };
  
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedImage) return null;
      
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('caption', caption);
      if (location) formData.append('location', location);
      
      // Fetch request with formData
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post created!",
        description: "Your post has been published successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'select' ? 'Create New Post' : 'Add Details'}
          </DialogTitle>
        </DialogHeader>
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        
        {step === 'select' ? (
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <i className="ri-image-add-line text-4xl text-muted-foreground"></i>
            </div>
            <p className="text-center text-muted-foreground mb-4">Drag photos and videos here</p>
            <Button 
              onClick={openFileSelector}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full transition"
            >
              Select from device
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {imagePreview && (
              <div className="aspect-square w-full overflow-hidden rounded-md mb-4">
                <img 
                  src={imagePreview} 
                  alt="Post preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full resize-none"
              rows={3}
            />
            
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button 
                onClick={() => createPost()}
                disabled={isPending || !caption.trim()}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {isPending ? "Posting..." : "Share"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
