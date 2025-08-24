"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type UIImage = {
  id: string;
  title: string;
  poster_url: string;
  created_at: string;
};

type Props = { initialImages: UIImage[] };

export function ImagesCarousel({ initialImages }: Props) {
  const images = initialImages ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = 1;

  const nextSlide = () =>
    setCurrentIndex((p) => (p + 1) % Math.max(images.length, 1));
  const prevSlide = () =>
    setCurrentIndex((p) => (p - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));

  const visible = useMemo(() => {
    if (!images.length) return [] as UIImage[];
    const out: UIImage[] = [];
    for (let i = 0; i < Math.min(visibleCount, images.length); i++) {
      const idx = (currentIndex + i) % images.length;
      out.push(images[idx]);
    }
    return out;
  }, [images, currentIndex]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground pt-4">Gallery</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>Click an image for details</span>
        </div>
      </div>

      <div className="relative flex items-center gap-4">
        {/* Left Arrow */}
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          disabled={images.length <= 1}
          className="shrink-0 rounded-full w-10 h-10 border-2 bg-transparent disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Image Container */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-6 justify-center py-4">
            {images.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8">
                No images available.
              </div>
            ) : (
              visible.map((img, index) => (
                <Dialog key={`${img.id}-${currentIndex}-${index}`}>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        "bg-transparent active:bg-transparent focus:bg-transparent appearance-none shadow-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "flex flex-col items-center gap-3 p-2 rounded-lg transition-transform duration-200 hover:scale-110",
                        "group cursor-pointer"
                      )}
                    >
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-md">
                        <Image
                          src={img.poster_url}
                          alt={img.title || "Uploaded image"}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>

                      <span className="text-sm font-medium text-center max-w-32 leading-tight">
                        {img.title}
                      </span>
                    </button>
                  </DialogTrigger>

                  <DialogContent
                    className="sm:max-w-md [&>button]:focus:outline-none [&>button]:focus:ring-0 [&>button]:focus-visible:outline-none [&>button]:focus-visible:ring-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md">
                          <Image
                            src={img.poster_url}
                            alt={img.title || "Uploaded image"}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                        {img.title}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {img.created_at && (
                        <p className="text-sm text-muted-foreground">
                          Uploaded on{" "}
                          {new Date(img.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))
            )}
          </div>
        </div>

        {/* Right Arrow */}
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          disabled={images.length <= 1}
          className="shrink-0 rounded-full w-10 h-10 border-2 bg-transparent disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
