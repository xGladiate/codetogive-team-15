"use client";

import { Button } from "@/components/ui/button";

export default function DonateButton() {
  const scrollToDonations = () => {
    document.getElementById("donations-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <Button
      variant="outline"
      onClick={scrollToDonations}
      className="border-gray-300 text-gray-700 hover:bg-gray-50"
    >
      Donate
    </Button>
  );
}
