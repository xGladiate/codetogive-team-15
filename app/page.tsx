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
    console.log("User is logged in:", user);
      // Redirect based on user role
      if (user.user_metadata.role === "donor") {
        redirect("/donor");
      } else if (user.user_metadata.role === "admin") {
        redirect("/admin");
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
