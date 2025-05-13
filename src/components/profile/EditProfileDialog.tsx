
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { Pencil, Upload, User } from "lucide-react";

interface EditProfileProps {
  userId: string;
  username?: string;
  avatarUrl?: string | null;
  onProfileUpdated: () => void;
  children?: React.ReactNode;
}

const EditProfileDialog = ({ userId, username, avatarUrl, onProfileUpdated, children }: EditProfileProps) => {
  const [open, setOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(username || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNewUsername(username || "");
    setPreviewUrl(avatarUrl || null);
  }, [username, avatarUrl, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const updateProfile = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = data.publicUrl;
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          username: newUsername,
          avatar_url: newAvatarUrl
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });

      onProfileUpdated();
      setOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-1">
            <Pencil className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and avatar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 cursor-pointer relative group" onClick={() => document.getElementById('avatar-upload')?.click()}>
              <AvatarImage src={previewUrl || ""} />
              <AvatarFallback className="text-lg">{getInitials(newUsername)}</AvatarFallback>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </Avatar>
            <Input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              type="button" 
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              Change Avatar
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Your display name"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={updateProfile} 
            disabled={isLoading || (!newUsername && !avatarFile)}
          >
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
