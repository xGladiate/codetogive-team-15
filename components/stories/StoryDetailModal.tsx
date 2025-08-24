"use client";

import React from "react";
import { Calendar, MapPin, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Story {
  id: number;
  created_at: string;
  title: string | null;
  story: string | null;
  school_id: number | null;
  content_type: "text" | "image" | "video";
  content_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

interface School {
  id: number;
  name: string;
  neighborhood: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  story: Story | null;
  schools: School[];
}

export default function StoryDetailModal({
  isOpen,
  onClose,
  story,
  schools,
}: Props) {
  if (!story) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSchoolName = (schoolId: number | null): string => {
    if (!schoolId) return "General Story";
    const school = schools.find((s) => s.id === schoolId);
    return school ? `${school.name}, ${school.neighborhood}` : "Unknown School";
  };

  const getImageUrl = (contentUrl: string | null): string | null => {
    if (!contentUrl) return null;
    if (/^https?:\/\//i.test(contentUrl)) return contentUrl;

    const supabase = createClient();
    return (
      supabase.storage.from("stories").getPublicUrl(contentUrl).data
        .publicUrl ?? null
    );
  };

  const imageUrl =
    story.content_type === "image" ? getImageUrl(story.content_url) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          {/* Story metadata */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar size={14} className="mr-2" />
              <span>{formatDate(story.created_at)}</span>
            </div>
            {story.metadata?.kind && (
              <div className="flex justify-start">
                <Badge variant="secondary" className="capitalize">
                  {story.metadata.kind.replace("_", " ")}
                </Badge>
              </div>
            )}
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
            {story.title || "Untitled Story"}
          </DialogTitle>

          {/* School info */}
          {story.school_id && (
            <div className="flex items-center text-blue-600">
              <MapPin size={16} className="mr-2 flex-shrink-0" />
              <span className="font-medium">
                {getSchoolName(story.school_id)}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {imageUrl && (
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
              <Image
                src={imageUrl}
                alt={story.title || "Story image"}
                className="w-full h-full object-cover"
                fill
                priority
              />
            </div>
          )}

          {/* Story content */}
          {story.story && (
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {story.story}
              </div>
            </div>
          )}

          {/* Call to action section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center space-y-4">
            <div className="flex items-center justify-center">
              <Heart size={24} className="text-blue-600 fill-current mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Inspired by this story?
              </h3>
            </div>
            <p className="text-gray-600">
              Your donation can help create more stories like this one. Every
              contribution makes a lasting impact.
            </p>
            <Link href="/donate" onClick={onClose}>
              <Button size="lg" className=" mt-4 bg-blue-600 hover:bg-blue-700">
                <Heart size={16} className="mr-2" />
                Make a Donation
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
