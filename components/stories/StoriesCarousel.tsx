"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import StoryDetailModal from "./StoryDetailModal";

// TypeScript interfaces
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
  stories: Story[];
  schools: School[];
  showHeader?: boolean;
  maxStories?: number;
}

export default function StoriesCarousel({
  stories,
  schools,
  showHeader = true,
  maxStories = 6,
}: Props) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const truncateText = (
    text: string | null,
    maxLength: number = 120
  ): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
  };

  // Limit the number of stories displayed
  const displayStories = stories.slice(0, maxStories);

  if (!displayStories.length) {
    return null;
  }

  return (
    <>
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          {showHeader && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Stories of Impact
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover the real stories behind our mission. See how your
                support transforms lives and communities.
              </p>
              <div className="flex items-center justify-center mt-6 text-lg text-blue-600">
                <Heart className="h-5 w-5 mr-2 fill-current" />
                <span>{displayStories.length} inspiring stories</span>
              </div>
            </div>
          )}

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {displayStories.map((story) => {
                const imageUrl =
                  story.content_type === "image"
                    ? getImageUrl(story.content_url)
                    : null;

                return (
                  <CarouselItem
                    key={story.id}
                    className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <Card
                      className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-lg cursor-pointer group"
                      onClick={() => handleStoryClick(story)}
                    >
                      <CardContent className="p-0">
                        <div className="relative">
                          {/* Header with metadata */}
                          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
                            <div className="flex items-center text-white text-sm">
                              <Calendar size={14} className="mr-2" />
                              <span>{formatDate(story.created_at)}</span>
                            </div>
                          </div>

                          {/* Click indicator overlay */}
                          <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3">
                              <Heart size={24} className="text-blue-600" />
                            </div>
                          </div>

                          {/* Image or placeholder */}
                          <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 relative">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={story.title || "Story image"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                fill
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <Heart
                                    size={48}
                                    className="mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <p className="text-blue-600 font-medium">
                                    Story Content
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                            {story.title || "Untitled Story"}
                          </h3>

                          {/* School info */}
                          {story.school_id && (
                            <div className="flex items-center text-blue-600 mb-4">
                              <MapPin
                                size={16}
                                className="mr-2 flex-shrink-0"
                              />
                              <span className="text-sm font-medium truncate">
                                {getSchoolName(story.school_id)}
                              </span>
                            </div>
                          )}

                          {/* Story content */}
                          <div className="text-gray-700 text-sm leading-relaxed mb-4">
                            <p className="whitespace-pre-wrap">
                              {truncateText(story.story)}
                            </p>
                          </div>

                          {/* Category badge */}
                          {story.metadata?.kind && (
                            <div className="flex justify-between items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {story.metadata.kind.replace("_", " ")}
                              </span>
                              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Click to read more →
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      </section>

      {/* Story Detail Modal */}
      <StoryDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        story={selectedStory}
        schools={schools}
      />
    </>
  );
}
