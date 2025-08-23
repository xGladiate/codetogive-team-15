"use client";

import { Package } from "@/types/database";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface Props {
  package: Package;
}

export default function PackageCard({ package: pkg }: Props) {
  const router = useRouter();

  const handleDonate = () => {
    router.push(`/donate?packageId=${pkg.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <Image
          src={pkg.picture_url || "/placeholder-image.jpg"}
          alt={pkg.name}
          fill
          className="object-contain"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
        <p className="text-gray-600 mb-4">{pkg.description}</p>
        {pkg.amount === 0 ? (
          <Button
            onClick={handleDonate}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Donate
          </Button>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-green-600">
              HK${pkg.amount.toLocaleString()}
            </span>
            <Button
              onClick={handleDonate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Donate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
