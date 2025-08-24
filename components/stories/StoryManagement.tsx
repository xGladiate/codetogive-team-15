"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Download, Eye } from "lucide-react";
import StoryEditDialog from "./StoryEditDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Story = {
  id: number;
  title: string | null;
  story: string | null;
  content_type: "text" | "image";
  content_url: string | null;
  metadata: any;
  created_at: string;
};

const KIND_ORDER = [
  "donor_report",
  "newsletter",
  "thank_you",
  "student_story",
  "other",
] as const;

export default function StoryManagement() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Error fetching stories:", error);
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => {
    const out: Record<string, Story[]> = {};
    for (const story of stories) {
      const k = story.metadata?.kind ?? "other";
      (out[k] ||= []).push(story);
    }
    return out;
  }, [stories]);

  const getImgUrl = (maybeUrl: string | null): string | null => {
    if (!maybeUrl) return null;
    if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
    return (
      supabase.storage.from("stories").getPublicUrl(maybeUrl).data.publicUrl ??
      null
    );
  };

  const dash = (s: string | null | undefined) => (s && s.trim() ? s : "—");

  const handleCreateNew = () => {
    setSelectedStory(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditStory = (story: Story) => {
    setSelectedStory(story);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedStory(null);
    setIsCreating(false);
  };

  const handleSaveStory = async (storyData: Partial<Story>) => {
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from("stories")
          .insert([storyData])
          .select();

        if (error) throw error;

        const newStory = data[0];
        setStories([newStory, ...stories]);
        toast.success("Story created successfully!");
      } else if (selectedStory) {
        const { data, error } = await supabase
          .from("stories")
          .update(storyData)
          .eq("id", selectedStory.id)
          .select();

        if (error) throw error;

        const updatedStory = data[0];
        setStories(
          stories.map((story) =>
            story.id === selectedStory.id ? updatedStory : story
          )
        );
        toast.success("Story updated successfully!");
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Failed to save story. Please try again.");
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;

      setStories(stories.filter((story) => story.id !== storyId));
      toast.success("Story deleted successfully!");
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Failed to delete story. Please try again.");
    }
  };

  const handleDownload = async (story: Story) => {
    try {
      if (story.content_type === "image") {
        const url = getImgUrl(story.content_url);
        if (!url) throw new Error("Missing image URL");
        const resp = await fetch(url);
        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${(story.title || "story").replace(
          /[^\w.-]+/g,
          "_"
        )}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      } else {
        const text = story.story || "";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${(story.title || "story").replace(
          /[^\w.-]+/g,
          "_"
        )}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      }
      toast.success("Download started!");
    } catch (e) {
      console.error("Download failed:", e);
      toast.error("Download failed. Please try again.");
    }
  };

  const handleView = (story: Story) => {
    if (story.content_type === "image") {
      const url = getImgUrl(story.content_url);
      if (url) {
        window.open(url, "_blank");
      }
    } else {
      // For text stories, we'll show in the edit dialog in view mode
      setSelectedStory(story);
      setIsCreating(false);
      setIsDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create New Story Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Story
        </Button>
      </div>

      {/* Stories by Category */}
      {KIND_ORDER.map((kind) =>
        groups[kind]?.length ? (
          <div key={kind}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 capitalize">
              {kind.replaceAll("_", " ")} ({groups[kind].length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups[kind].map((story) => {
                const isImage = story.content_type === "image";
                const img = isImage ? getImgUrl(story.content_url) : null;

                return (
                  <div
                    key={story.id}
                    className="border rounded-xl bg-white p-4 space-y-3 hover:shadow-lg transition-shadow"
                  >
                    {/* Header with actions */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">
                          {new Date(story.created_at).toLocaleDateString()}
                        </div>
                        <div className="font-semibold text-lg mt-1">
                          {dash(story.title)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(story)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStory(story)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Story</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;
                                {story.title || "this story"}&quot;? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStory(story.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Content Preview */}
                    {isImage && img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className="w-full h-48 object-cover rounded-lg border cursor-pointer"
                        onClick={() => handleView(story)}
                      />
                    ) : (
                      <div
                        className="text-sm whitespace-pre-wrap line-clamp-4 min-h-20 bg-gray-50 p-3 rounded cursor-pointer"
                        onClick={() => handleView(story)}
                      >
                        {dash(story.story)}
                      </div>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 rounded-full border bg-gray-50">
                        {story.content_type}
                      </span>
                      <span className="px-2 py-1 rounded-full border bg-gray-50">
                        {dash(story.metadata?.lang)}
                      </span>
                      <span className="px-2 py-1 rounded-full border bg-gray-50">
                        {dash(story.metadata?.template)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(story)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      )}

      {!loading && stories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No stories found.</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first story to get started.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <StoryEditDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        story={selectedStory}
        isCreating={isCreating}
        onSave={handleSaveStory}
      />
    </div>
  );
}
