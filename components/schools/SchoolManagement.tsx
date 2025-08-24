"use client";

import { useState } from "react";
import { School } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SchoolEditCard from "./SchoolEditCard";
import SchoolEditDialog from "./SchoolEditDialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Props {
  schools: School[];
}

export default function SchoolManagement({ schools: initialSchools }: Props) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  const handleCreateNew = () => {
    setSelectedSchool(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedSchool(null);
    setIsCreating(false);
  };

  const handleSaveSchool = async (schoolData: Partial<School>) => {
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from("schools")
          .insert([schoolData])
          .select();

        if (error) throw error;

        const newSchool = data[0];
        setSchools([newSchool, ...schools]);
        toast.success("School created successfully!");
      } else if (selectedSchool) {
        const { data, error } = await supabase
          .from("schools")
          .update(schoolData)
          .eq("id", selectedSchool.id)
          .select();

        if (error) throw error;

        const updatedSchool = data[0];
        setSchools(
          schools.map((school) =>
            school.id === selectedSchool.id ? updatedSchool : school
          )
        );
        toast.success("School updated successfully!");
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error saving school:", error);
      toast.error("Failed to save school. Please try again.");
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    try {
      const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", schoolId);

      if (error) throw error;

      setSchools(schools.filter((school) => school.id !== schoolId));
      toast.success("School deleted successfully!");
    } catch (error) {
      console.error("Error deleting school:", error);
      toast.error("Failed to delete school. Please try again.");
    }
  };

  const sortedSchools = [...schools].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-8">
      {/* Create New School Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New School
        </Button>
      </div>

      {/* Schools List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Schools ({schools.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSchools.map((school) => (
            <SchoolEditCard
              key={school.id}
              school={school}
              onEdit={handleEditSchool}
              onDelete={handleDeleteSchool}
            />
          ))}
        </div>

        {schools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No schools found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first school to get started.
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <SchoolEditDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        school={selectedSchool}
        isCreating={isCreating}
        onSave={handleSaveSchool}
      />
    </div>
  );
}
