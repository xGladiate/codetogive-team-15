"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const pathname = usePathname();

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

  const NavButton = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => {
    const isActive = pathname === href;

    return (
      <Button
        asChild
        variant={isActive ? "default" : "ghost"}
        size="default"
        className={
          isActive
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        }
      >
        <Link href={href}>{children}</Link>
      </Button>
    );
  };

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
          <div className="flex gap-2 items-center">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
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

        <div className="flex gap-2 items-center">
          <NavButton href="/">Home</NavButton>
          {user && userRole === "admin" ? (
            <>
              <NavButton href="/admin">Admin Dashboard</NavButton>
              <NavButton href="/package">Package Management</NavButton>
              <NavButton href="/prospector">Prospecting Tool</NavButton>
              <NavButton href="/writer">AI Writer</NavButton>
            </>
          ) : (
            <>
              {user && <NavButton href="/donor">Donor Profile</NavButton>}
              <NavButton href="/donor-dashboard">Donor Dashboard</NavButton>
              <NavButton href="/donate">Donate</NavButton>
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
