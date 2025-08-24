"use client";

import React, { useState, useEffect } from "react";
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
import DonationButton from "@/components/make-a-donation-button";
import Image from "next/image";

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

interface Donation {
  donor_id: string;
  school_id: number | null;
}

const DonorStoriesPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDonationMessage, setShowDonationMessage] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowDonationMessage(false);

        const supabase = createClient();

        // Get current authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("User not authenticated");
        }

        // Check user's donations
        const { data: donations, error: donationsError } = await supabase
          .from("donations")
          .select("donor_id, school_id")
          .eq("donor_id", user.id);

        if (donationsError) {
          throw donationsError;
        }

        // If no donations found, show donation message
        if (!donations || donations.length === 0) {
          setShowDonationMessage(true);
          setStories([]);
          return;
        }

        // Fetch schools data
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("id, name, neighborhood");

        if (schoolsError) {
          console.error("Error fetching schools:", schoolsError);
        } else {
          setSchools(schoolsData || []);
        }

        // Check if user has donated to all schools (null present)
        const hasNullSchool = donations.some(
          (donation: Donation) => donation.school_id === null
        );

        let storiesQuery = supabase
          .from("stories")
          .select("*")
          .order("created_at", { ascending: false });

        if (!hasNullSchool) {
          // Filter stories to only schools the user has donated to
          const donatedSchoolIds = donations
            .map((donation: Donation) => donation.school_id)
            .filter((id): id is number => id !== null);

          if (donatedSchoolIds.length > 0) {
            storiesQuery = storiesQuery.in("school_id", donatedSchoolIds);
          } else {
            setStories([]);
            return;
          }
        }

        const { data: storiesData, error: storiesError } = await storiesQuery;

        if (storiesError) {
          throw storiesError;
        }

        setStories(storiesData || []);
      } catch (err) {
        setError("Failed to load stories");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    maxLength: number = 150
  ): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading inspiring stories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Stories of Impact
            </h1>
            <p className="text-xl text-gray-600">
              See how your donations are making a difference
            </p>
            <div className="flex items-center justify-center mt-4 text-lg text-blue-600">
              <Heart className="h-5 w-5 mr-2 fill-current" />
              <span>{stories.length} inspiring stories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {showDonationMessage ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg mx-auto">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart size={40} className="text-white fill-current" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Start Your Impact Journey
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Make your first donation to unlock inspiring stories from the
                schools and communities you support. Every contribution creates
                a story worth sharing.
              </p>
              <DonationButton size="lg" />
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={40} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Stories Yet
              </h3>
              <p className="text-gray-600 text-lg">
                Stories from your supported schools will appear here soon.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {stories.map((story) => {
                  const imageUrl =
                    story.content_type === "image"
                      ? getImageUrl(story.content_url)
                      : null;

                  return (
                    <CarouselItem
                      key={story.id}
                      className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                    >
                      <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-lg">
                        <CardContent className="p-0">
                          <div className="relative">
                            {/* Header with metadata */}
                            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
                              <div className="flex items-center text-white text-sm">
                                <Calendar size={14} className="mr-2" />
                                <span>{formatDate(story.created_at)}</span>
                              </div>
                            </div>

                            {/* Image or placeholder */}
                            <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 relative">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={story.title || "Story image"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  fill
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <Heart
                                      size={48}
                                      className="mx-auto text-blue-400 mb-2"
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
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
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
                              <div className="flex justify-end">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                  {story.metadata.kind.replace("_", " ")}
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

            {/* Call to action */}
            <div className="text-center mt-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Inspired by These Stories?
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Your continued support helps create more stories like these.
                  Every donation makes a lasting impact.
                </p>
                <DonationButton size="lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorStoriesPage;
