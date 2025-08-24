import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManagementLayout from "@/components/management/ManagementLayout";

export default async function ManagementPage() {
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

  // Fetch all schools
  const { data: schools } = await supabase
    .from("schools")
    .select("*")
    .order("name", { ascending: true });

  return <ManagementLayout packages={packages || []} schools={schools || []} />;
}
