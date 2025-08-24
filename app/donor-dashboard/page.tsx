"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, Router } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { createClient } from '@/lib/supabase/client';
import DonationButton from '@/components/make-a-donation-button';

// TypeScript interfaces
interface StoryImage {
  created_at: string;
  school_id: number | null;
  poster_url: string;
}

interface Donation {
  donor_id: string;
  school_id: number | null;
}

interface PosterGalleryProps {
  // Add any props you might need
}

const PosterGallery: React.FC<PosterGalleryProps> = () => {
  const [images, setImages] = useState<StoryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<StoryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDonationMessage, setShowDonationMessage] = useState<boolean>(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowDonationMessage(false);
        
        const supabase = createClient();
        
        // Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }
        
        // Check user's donations
        const { data: donations, error: donationsError } = await supabase
          .from('donations')
          .select('donor_id, school_id')
          .eq('donor_id', user.id);
        

console.log("donations:", donations);
console.log("donationsError:", donationsError);

        if (donationsError) {
          throw donationsError;
        }
        
        // If no donations found, show donation message
        if (!donations || donations.length === 0) {
          setShowDonationMessage(true);
          setImages([]);
          return;
        }
        
        // Check if user has donated to all schools (null present)
        const hasNullSchool = donations.some((donation: Donation) => donation.school_id === null);
        
        let storiesQuery = supabase
          .from('stories')
          .select('created_at, school_id, poster_url')
          .order('created_at', { ascending: false });
        
        if (!hasNullSchool) {
          // Filter stories to only schools the user has donated to
          const donatedSchoolIds = donations
            .map((donation: Donation) => donation.school_id)
            .filter((id): id is number => id !== null); // Remove nulls and assert type
          
          if (donatedSchoolIds.length > 0) {
            storiesQuery = storiesQuery.in('school_id', donatedSchoolIds);
          } else {
            // No valid school IDs, show empty
            setImages([]);
            return;
          }
        }
        // If hasNullSchool is true, we show all stories (no additional filter)
        
        const { data: stories, error: storiesError } = await storiesQuery;
        
        if (storiesError) {
          throw storiesError;
        }
        
        setImages(stories || []);
        
      } catch (err) {
        setError('Failed to load images');
        console.error('Error fetching images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-HK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openModal = (image: StoryImage, index: number): void => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeModal = (): void => {
    setSelectedImage(null);
  };

  const navigateModal = (direction: 'next' | 'prev'): void => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % images.length 
      : (currentIndex - 1 + images.length) % images.length;
    
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const handleKeyPress = (e: KeyboardEvent): void => {
    if (selectedImage) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') navigateModal('prev');
      if (e.key === 'ArrowRight') navigateModal('next');
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, currentIndex, images]); // Added 'images' to dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Stories</h1>
          <p className="text-gray-600 mt-2">{images.length} Stories Updates</p>
        </div>
      </div>

      {/* Gallery Carousel */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {showDonationMessage ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} className="text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Your Journey
              </h3>
              <p className="text-gray-600 mb-6">
                Make your first donation to unlock and view inspiring stories from the schools and communities you support.
              </p>
              <DonationButton size="lg" />
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No stories available from your donated schools.</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Carousel className="w-full max-w-sm md:max-w-md lg:max-w-lg">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={`${image.created_at}-${index}`}>
                    <div className="p-2">
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <div 
                            className="group relative cursor-pointer"
                            onClick={() => openModal(image, index)}
                          >
                            <div className="aspect-[840/1188] overflow-hidden">
                              <img
                                src={image.poster_url}
                                alt={`Poster from ${formatDate(image.created_at)}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                            
                            {/* Image Info Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
                              <div className="w-full bg-white bg-opacity-95 backdrop-blur-sm p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <div className="flex items-center text-gray-700 text-sm">
                                  <Calendar size={16} className="mr-2" />
                                  <span>{formatDate(image.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2"
              type="button"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {/* Scrollable Image Container */}
            <div className="flex-1 w-full overflow-auto flex items-start justify-center pt-16 pb-20">
              <div className="flex flex-col items-center min-h-full justify-center">
                <img
                  src={selectedImage.poster_url}
                  alt={`Poster from ${formatDate(selectedImage.created_at)}`}
                  className="max-w-full h-auto object-contain rounded-lg shadow-2xl"
                  style={{ minHeight: '100vh' }} // Ensure image is tall enough to scroll
                />
              </div>
            </div>

            {/* Fixed Date Info at Bottom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black bg-opacity-70 px-4 py-2 rounded-lg z-20">
              <div className="flex items-center justify-center">
                <Calendar size={18} className="mr-2" />
                <span className="text-lg font-medium">
                  {formatDate(selectedImage.created_at)}
                </span>
              </div>
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="mt-1 text-white text-sm">
                  {currentIndex + 1} of {images.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterGallery;