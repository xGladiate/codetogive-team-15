"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>;
  }

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!<Button onClick={handleSignOut}>Logout</Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild variant="outline">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
      <Button asChild>
        <Link href="/auth/login">Sign in</Link>
      </Button>
    </div>
  );
}
