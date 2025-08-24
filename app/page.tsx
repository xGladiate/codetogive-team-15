import { createClient } from "@/lib/supabase/server";
import Header from "@/components/landing_page/Header";
import DataVisualization from "@/components/landing_page/DataVisualization";
import DonationsSection from "@/components/landing_page/DonationsSection";
import ProgressBar from "@/components/landing_page/ProgressBar";
import StoriesCarousel from "@/components/stories/StoriesCarousel";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // console.log("User is logged in:", user);
  }

  // Fetch packages from Supabase
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch recent stories for the carousel
  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8); // Get more than we need for variety

  // Fetch schools for story context
  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, neighborhood");

  // Fetch donations to calculate total raised
  const { data: donations } = await supabase.from("donations").select("amount");
  const totalRaised =
    donations?.reduce((sum, donation) => sum + donation.amount, 0) || 50000;
  const campaignGoal = 10000;

  return (
    <main className="min-h-screen">
      <Header />
      <StoriesCarousel
        stories={stories || []}
        schools={schools || []}
        showHeader={true}
        maxStories={6}
      />
      <DataVisualization />
      <ProgressBar current={totalRaised} goal={campaignGoal} />
      <DonationsSection packages={packages || []} />
    </main>
  );
}
