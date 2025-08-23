"use client";

import { useState } from "react";
import { Package } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PackageEditCard from "./PackageEditCard";
import PackageEditDialog from "./PackageEditDialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Props {
  packages: Package[];
}

export default function PackageManagement({
  packages: initialPackages,
}: Props) {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  const handleCreateNew = () => {
    setSelectedPackage(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPackage(null);
    setIsCreating(false);
  };

  const handleSavePackage = async (packageData: Partial<Package>) => {
    try {
      if (isCreating) {
        // Create new package
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        const { id, ...createData } = packageData as any;
        const { data, error } = await supabase
          .from("packages")
          .insert([createData])
          .select()
          .single();

        if (error) throw error;

        setPackages([data, ...packages]);
        toast.success("Package created successfully!");
      } else if (selectedPackage) {
        // Update existing package
        const { data, error } = await supabase
          .from("packages")
          .update(packageData)
          .eq("id", selectedPackage.id)
          .select()
          .single();

        if (error) throw error;

        setPackages(
          packages.map((pkg) => (pkg.id === selectedPackage.id ? data : pkg))
        );
        toast.success("Package updated successfully!");
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package. Please try again.");
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", packageId);

      if (error) throw error;

      setPackages(packages.filter((pkg) => pkg.id !== packageId));
      toast.success("Package deleted successfully!");
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package. Please try again.");
    }
  };

  const corePackages = packages.filter((pkg) => pkg.type === "core");
  const communityPackages = packages.filter((pkg) => pkg.type === "community");

  return (
    <div className="space-y-8">
      {/* Create New Package Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Package
        </Button>
      </div>

      {/* Core Packages */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Core Packages ({corePackages.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corePackages.map((pkg) => (
            <PackageEditCard
              key={pkg.id}
              package={pkg}
              onEdit={handleEditPackage}
              onDelete={handleDeletePackage}
            />
          ))}
        </div>
      </div>

      {/* Community Packages */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Community Packages ({communityPackages.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityPackages.map((pkg) => (
            <PackageEditCard
              key={pkg.id}
              package={pkg}
              onEdit={handleEditPackage}
              onDelete={handleDeletePackage}
            />
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <PackageEditDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        package={selectedPackage}
        isCreating={isCreating}
        onSave={handleSavePackage}
      />
    </div>
  );
}
