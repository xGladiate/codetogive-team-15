"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import NavigationText from "../navigator-text";
import Image from "next/image";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setUserRole(user?.user_metadata?.role || null);
      setLoading(false);
    };
    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user || null);
        setUserRole(session?.user?.user_metadata?.role || null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) {
    return (
      <nav className="bg-cream-50 py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-800 font-bold text-lg"
          >
            <Image
              src="/favicon.ico"
              alt="Project Reach"
              width={24}
              height={24}
            />
            PROJECT REACH
          </Link>
          <div className="flex gap-6 items-center">
            {/* Loading skeleton */}
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-cream-50 py-3 px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-800 font-bold text-lg"
        >
          <Image
            src="/favicon.ico"
            alt="Project Reach"
            width={24}
            height={24}
          />
          PROJECT REACH
        </Link>

        <div className="flex gap-6 items-center">
          <NavigationText label="Home" path="/" />
          {user && userRole === "admin" ? (
            <>
              <NavigationText label="Admin Page" path="/admin" />
              <NavigationText label="Outreach Tool" path="/outreach" />
              <NavigationText label="Package Management" path="/package" />
            </>
          ) : (
            <>
              {user && <NavigationText label="Donor Dashboard" path="/donor" />}
              <NavigationText label="Donate" path="/donate" />
            </>
          )}
        </div>

        <div className="flex gap-3">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
