import { createClient } from "@/lib/supabase/server";
import Header from "@/components/landing_page/Header";
import DataVisualization from "@/components/landing_page/DataVisualization";
import DonationsSection from "@/components/landing_page/DonationsSection";
import ProgressBar from "@/components/landing_page/ProgressBar";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data: authUser } = await supabase.auth.getClaims();

  const user = authUser?.claims;

  if (user) {
    // Only query roles if the user exists
    const { data: userRole, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.sub)
      .single();

    if (error || !userRole) {
      // Fall back to showing landing page instead of throwing an error
    } else {
      // Redirect based on user role
      if (userRole.role === "donor") {
        redirect("/donor");
      } else if (userRole.role === "admin") {
        redirect("/admin");
      }
    }
  }

  // Fetch packages from Supabase
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  const totalRaised = 8000;
  // const totalRaised =
  //   donations?.reduce((sum, donation) => sum + donation.amount, 0) || 50000;
  const campaignGoal = 10000;

  return (
    <main className="min-h-screen">
      <Header />
      <DataVisualization />
      <ProgressBar current={totalRaised} goal={campaignGoal} />
      <DonationsSection packages={packages || []} />
    </main>
  );
}
