import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DonateButton from "./DonateButton";

export default async function Header() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userRole = null;

  if (user) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    userRole = data?.role;
  }

  return (
    <div className="relative">
      {/* Navigation Bar */}
      <nav className="bg-cream-50 py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-gray-800 font-bold text-lg">
            PROJECT REACH
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-6">
              {user && (
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="/donor"
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Donor Dashboard
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {user && userRole === "admin" && (
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="/admin"
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Admin Page
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex gap-3">
            <DonateButton />

            {!user ? (
              <Button
                asChild
                variant="default"
                className="bg-gray-800 hover:bg-gray-700"
              >
                <Link href="/auth/login">Login</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="default"
                className="bg-gray-800 hover:bg-gray-700"
              >
                <Link href="/auth/logout">Logout</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Shorter Hero Section */}
      <div className="relative bg-cover bg-center bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-green-600">
            Together We Level The Playing Field
          </h1>
          <p className="text-lg max-w-3xl mx-auto leading-relaxed text-gray-800 bg-opacity-80 p-4 rounded-lg">
            Project REACH is solely supported by donations. No matter what
            amount, big or small, every contribution is important to us.
          </p>
        </div>
      </div>
    </div>
  );
}
