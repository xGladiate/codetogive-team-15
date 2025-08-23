"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils"; // optional helper for conditional classes

interface NavigationTextProps {
  label: string;
  path: string;
  className?: string;
}

export default function NavigationText({ label, path, className }: NavigationTextProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(path)}
      className={cn(
        "cursor-pointer text-lg text-gray-700 hover:text-blue-600 transition-colors duration-200",
        className
      )}
    >
      {label}
    </div>
  );
}
