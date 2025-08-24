import { createClient } from "@/lib/supabase/server";
import DonateForm from "@/components/donate/DonateForm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    packageId?: string;
  }>;
}

export default async function DonatePage({ searchParams }: Props) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get all packages for dropdown
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("name");

  // Get all schools for dropdown
  const { data: schools } = await supabase
    .from("schools")
    .select("*")
    .order("name");

  // Get the selected package
  const selectedPackageId = parseInt(params.packageId || "2");
  const selectedPackage =
    packages?.find((pkg) => pkg.id === selectedPackageId) || packages?.[0];

  if (!selectedPackage || !packages || !schools) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <DonateForm
          selectedPackage={selectedPackage}
          packages={packages}
          schools={schools}
          user={user}
        />
      </div>
    </div>
  );
}
