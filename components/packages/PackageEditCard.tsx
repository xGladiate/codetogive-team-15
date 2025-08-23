"use client";

import { Package } from "@/types/database";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  package: Package;
  onEdit: (pkg: Package) => void;
  onDelete: (packageId: string) => void;
}

export default function PackageEditCard({
  package: pkg,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{pkg.name}</CardTitle>
            <Badge variant={pkg.type === "core" ? "default" : "secondary"}>
              {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Package</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{pkg.name}&quot;? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(pkg.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative h-32 bg-gray-100 rounded-md overflow-hidden">
          <Image
            src={pkg.picture_url || "/placeholder-image.jpg"}
            alt={pkg.name}
            fill
            className="object-contain"
          />
        </div>

        <div>
          <p className="text-sm text-gray-600 line-clamp-3">
            {pkg.description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-semibold text-green-600">
            {pkg.amount === 0
              ? "Custom Amount"
              : `HK$${pkg.amount.toLocaleString()}`}
          </span>
          <Button onClick={() => onEdit(pkg)} size="sm">
            Edit Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
