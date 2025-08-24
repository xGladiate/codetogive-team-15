"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DonationButton from "@/components/make-a-donation-button";
import StoriesCarousel from "@/components/stories/StoriesCarousel";

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
              See how your donations are making a difference!
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
            <StoriesCarousel
              stories={stories}
              schools={schools}
              showHeader={false}
            />

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
