"use client"

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string;
  achieved: boolean;
  achievedDate?: string | null;
};

export function BadgesCarousel() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const visibleBadges = 6;

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/donor/badges", { cache: "no-store" });
        if (!res.ok) throw new Error(`Badges fetch failed: ${res.status}`);
        const data = (await res.json()) as Badge[];
        if (!cancel) setBadges(data);
      } catch (e) {
        console.error(e);
        if (!cancel) setBadges([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const nextSlide = () => setCurrentIndex((p) => (p + 1) % Math.max(badges.length, 1));
  const prevSlide = () => setCurrentIndex((p) => (p - 1 + Math.max(badges.length, 1)) % Math.max(badges.length, 1));

  const visible = useMemo(() => {
    if (loading || !badges.length) return [] as Badge[];
    const out: Badge[] = [];
    for (let i = 0; i < visibleBadges; i++) {
      const idx = (currentIndex + i) % badges.length;
      out.push(badges[idx]);
    }
    return out;
  }, [badges, currentIndex, loading]);


  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground py-4">Badges</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>Click in to see details</span>
        </div>
      </div>

      <div className="relative flex items-center gap-4">
        {/* Left Arrow */}
        <Button variant="outline" size="icon" onClick={prevSlide} className="shrink-0 rounded-full w-10 h-10 border-2 bg-transparent">
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Badge Container */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-6 justify-center py-4">
            {loading ? (
              Array.from({ length: visibleBadges }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex flex-col items-center gap-3 p-2">
                  <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
                  <div className="h-9 w-20 rounded bg-muted/70 animate-pulse" />
                </div>
              ))
            ) : (
              visible.map((badge, index) => (
                <Dialog key={`${badge.id}-${currentIndex}-${index}`}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setSelectedBadge(badge)}
                      className={cn(
                        "bg-transparent active:bg-transparent focus:bg-transparent appearance-none shadow-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "flex flex-col items-center gap-3 p-2 rounded-lg transition-transform duration-200 hover:scale-110",
                        "group cursor-pointer"
                      )}
                    >
                      {/* Circle image badge with green outline when achieved */}
                      <div className={cn("relative w-20 h-20 rounded-full overflow-hidden transition", badge.achieved ? "ring-4 ring-green-600" : "")}>
                        <Image
                          src={badge.icon_url}
                          alt={badge.name}
                          fill
                          sizes="80px"
                          className={cn("object-cover rounded-full", !badge.achieved && "grayscale")}
                        />
                        {!badge.achieved && <div className="absolute inset-0 rounded-full bg-black/35" />}
                      </div>

                      <span className={cn("text-sm font-medium text-center max-w-20 leading-tight", badge.achieved ? "text-foreground" : "text-muted-foreground")}>
                        {badge.name}
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
                        <div className={cn("relative w-20 h-20 rounded-full overflow-hidden", badge.achieved ? "ring-4 ring-green-600" : "")}>
                          <Image
                            src={badge.icon_url}
                            alt={badge.name}
                            fill
                            sizes="80px"
                            className={cn("object-cover rounded-full", !badge.achieved && "grayscale")}
                          />
                          {!badge.achieved && <div className="absolute inset-0 rounded-full bg-black/35" />}
                        </div>
                        {badge.name}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {badge.description && <p className="text-muted-foreground">{badge.description}</p>}
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", badge.achieved ? "bg-green-500" : "bg-gray-400")} />
                        <span className="text-sm font-medium">
                          {badge.achieved ? "Achieved" : "Not achieved yet"}
                        </span>
                      </div>
                      {badge.achieved && badge.achievedDate && (
                        <p className="text-sm text-muted-foreground">
                          Earned on{" "}
                          {new Date(badge.achievedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
        <Button variant="outline" size="icon" onClick={nextSlide} className="shrink-0 rounded-full w-10 h-10 border-2 bg-transparent">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
