"use client";

import { useState, useEffect } from "react";
import { School } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
  isCreating: boolean;
  onSave: (schoolData: Partial<School>) => Promise<void>;
}

export default function SchoolEditDialog({
  isOpen,
  onClose,
  school,
  isCreating,
  onSave,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    neighborhood: "",
    total_funding: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name,
        neighborhood: school.neighborhood,
        total_funding: school.total_funding,
      });
    } else {
      setFormData({
        name: "",
        neighborhood: "",
        total_funding: 0,
      });
    }
  }, [school, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.neighborhood.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New School" : "Edit School"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">School Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter school name"
            />
          </div>

          <div>
            <Label htmlFor="neighborhood">Neighborhood*</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) =>
                setFormData({ ...formData, neighborhood: e.target.value })
              }
              placeholder="Enter neighborhood"
            />
          </div>

          <div>
            <Label htmlFor="total_funding">Total Funding (HK$)</Label>
            <Input
              id="total_funding"
              type="number"
              min="0"
              step="0.01"
              value={formData.total_funding}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  total_funding: Number(e.target.value),
                })
              }
              placeholder="Enter total funding amount"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isCreating
                ? "Create School"
                : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
