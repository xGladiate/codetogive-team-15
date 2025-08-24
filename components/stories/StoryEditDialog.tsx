"use client";

import { useState, useEffect } from "react";
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

type Story = {
  id: number;
  title: string | null;
  story: string | null;
  content_type: "text" | "image";
  content_url: string | null;
  metadata: any;
  created_at: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  story: Story | null;
  isCreating: boolean;
  onSave: (storyData: Partial<Story>) => Promise<void>;
}

export default function StoryEditDialog({
  isOpen,
  onClose,
  story,
  isCreating,
  onSave,
}: Props) {
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    content_type: "text" as "text" | "image",
    content_url: "",
    metadata: {
      kind: "other",
      lang: "en",
      template: "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || "",
        story: story.story || "",
        content_type: story.content_type,
        content_url: story.content_url || "",
        metadata: {
          kind: story.metadata?.kind || "other",
          lang: story.metadata?.lang || "en",
          template: story.metadata?.template || "",
        },
      });
    } else {
      setFormData({
        title: "",
        story: "",
        content_type: "text",
        content_url: "",
        metadata: {
          kind: "other",
          lang: "en",
          template: "",
        },
      });
    }
  }, [story, isOpen]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        metadata: formData.metadata,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New Story" : "Edit Story"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Title*</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter story title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="content_type">Content Type</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value: "text" | "image") =>
                  setFormData({ ...formData, content_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="kind">Category</Label>
              <Select
                value={formData.metadata.kind}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, kind: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="donor_report">Donor Report</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="thank_you">Thank You</SelectItem>
                  <SelectItem value="student_story">Student Story</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lang">Language</Label>
              <Select
                value={formData.metadata.lang}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, lang: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh-Hant">繁體中文</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template">Template</Label>
              <Input
                id="template"
                value={formData.metadata.template}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      template: e.target.value,
                    },
                  })
                }
                placeholder="Template name"
              />
            </div>
          </div>

          {formData.content_type === "image" && (
            <div>
              <Label htmlFor="content_url">Image URL</Label>
              <Input
                id="content_url"
                value={formData.content_url}
                onChange={(e) =>
                  setFormData({ ...formData, content_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          <div>
            <Label htmlFor="story">Content</Label>
            <Textarea
              id="story"
              value={formData.story}
              onChange={(e) =>
                setFormData({ ...formData, story: e.target.value })
              }
              placeholder="Enter story content"
              rows={8}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isCreating
                ? "Create Story"
                : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
