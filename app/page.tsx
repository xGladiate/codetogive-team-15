import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/landing_page/Header";
import DataVisualization from "@/components/landing_page/DataVisualization";
import DonationsSection from "@/components/landing_page/DonationsSection";
import ProgressBar from "@/components/landing_page/ProgressBar";

export default async function Home() {
  const supabase = await createClient();

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

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Next.js Supabase Starter</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
        </div>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
