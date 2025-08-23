import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PackageManagement from "@/components/packages/PackageManagement";

export default async function PackagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (user.user_metadata?.role !== "admin") {
    redirect("/");
  }

  // Fetch all packages
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Package Management
          </h1>
          <p className="text-gray-600">
            Manage donation packages and their details
          </p>
        </div>
        <PackageManagement packages={packages || []} />
      </div>
    </div>
  );
}
