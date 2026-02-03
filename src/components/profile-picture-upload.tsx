"use client";

import { useState, useRef } from "react";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useUploadProfilePicture, useDeleteProfilePicture, useProfilePictureUrl } from "@/lib/queries/employees";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import { cn } from "@/lib/utils";

interface ProfilePictureUploadProps {
  employeeId: string;
  currentPicture?: string | null;
  employeeName: string;
  employeeInitials: string;
  onUploadSuccess?: () => void;
}

export function ProfilePictureUpload({
  employeeId,
  currentPicture,
  employeeName,
  employeeInitials,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadProfilePicture(employeeId);
  const deleteMutation = useDeleteProfilePicture(employeeId);
  
  // Get presigned URL for protected images
  const { data: pictureUrlData } = useProfilePictureUrl(
    currentPicture ? employeeId : undefined
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync(selectedFile);
      toast.success("Profile picture updated successfully");
      setOpen(false);
      setPreview(null);
      setSelectedFile(null);
      onUploadSuccess?.();
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to upload profile picture");
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!currentPicture) return;

    const confirmed = window.confirm("Are you sure you want to delete the profile picture?");
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync();
      toast.success("Profile picture deleted successfully");
      onUploadSuccess?.();
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete profile picture");
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get the full image URL (prioritize presigned URL for protected images)
  const getImageUrl = (path?: string | null) => {
    // If we have a presigned URL from the API, use it
    if (pictureUrlData?.url) {
      return pictureUrlData.url;
    }

    // Otherwise fall back to direct URL handling
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${path}`;
  };

  const imageUrl = getImageUrl(currentPicture);

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24 border-2">
        <AvatarImage src={imageUrl || undefined} alt={employeeName} />
        <AvatarFallback className="text-2xl">{employeeInitials}</AvatarFallback>
      </Avatar>

      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Change profile picture</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Profile Picture</DialogTitle>
                <DialogDescription>
                  Upload a new profile picture. Supported formats: JPG, PNG, GIF, WEBP (max 5MB)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {preview ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="h-48 w-48 rounded-full object-cover border-2"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                          onClick={() => {
                            setPreview(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-center text-muted-foreground">
                      {selectedFile?.name}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32 border-2">
                      <AvatarImage src={imageUrl || undefined} alt={employeeName} />
                      <AvatarFallback className="text-4xl">
                        {employeeInitials}
                      </AvatarFallback>
                    </Avatar>

                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {preview ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={uploadMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {currentPicture && (
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete profile picture</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
