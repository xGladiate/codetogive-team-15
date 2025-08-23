"use client";

import { useState, useEffect, useRef } from "react";
import { Package } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  package: Package | null;
  isCreating: boolean;
  onSave: (packageData: Partial<Package>) => Promise<void>;
}

export default function PackageEditDialog({
  isOpen,
  onClose,
  package: pkg,
  isCreating,
  onSave,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: 0,
    picture_url: "",
    type: "core" as "core" | "community",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name,
        description: pkg.description,
        amount: pkg.amount,
        picture_url: pkg.picture_url,
        type: pkg.type,
      });
      setPreviewUrl(pkg.picture_url);
    } else {
      setFormData({
        name: "",
        description: "",
        amount: 0,
        picture_url: "",
        type: "core",
      });
      setPreviewUrl("");
    }
    setSelectedFile(null);
  }, [pkg, isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData({ ...formData, picture_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `packages/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Generate signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("assets")
      .createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1 year in seconds

    if (signedError) {
      throw new Error(`Failed to generate signed URL: ${signedError.message}`);
    }

    return signedData.signedUrl;
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    setIsUploading(true);

    try {
      const finalFormData = { ...formData };

      // If there's a new file selected, upload it
      if (selectedFile) {
        toast.info("Uploading image...");
        const uploadedUrl = await uploadImage(selectedFile);
        finalFormData.picture_url = uploadedUrl;
        toast.success("Image uploaded successfully!");
      }

      await onSave(finalFormData);
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save package"
      );
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New Package" : "Edit Package"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Package Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter package name"
              />
            </div>

            <div>
              <Label htmlFor="type">Package Type*</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "core" | "community") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount (HK$)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
              placeholder="Enter amount (0 for custom amount)"
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <Label>Package Image</Label>
            <div className="space-y-4">
              {/* Image Preview */}
              {previewUrl && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                  <Image
                    src={previewUrl}
                    alt="Package preview"
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* File Input */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {previewUrl ? "Change Image" : "Upload Image"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="text-sm text-gray-500">
                  Max 5MB, JPG/PNG/GIF
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter package description"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving
                ? isUploading
                  ? "Uploading..."
                  : "Saving..."
                : isCreating
                ? "Create Package"
                : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
