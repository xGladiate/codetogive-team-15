"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "@/types/database";
import PackageManagement from "@/components/packages/PackageManagement";

interface Props {
  packages: Package[];
}

type ManagementTab = "packages" | "schools" | "stories";

export default function ManagementLayout({ packages }: Props) {
  const [activeTab, setActiveTab] = useState<ManagementTab>("packages");

  const TabButton = ({
    tab,
    children,
  }: {
    tab: ManagementTab;
    children: React.ReactNode;
  }) => {
    const isActive = activeTab === tab;

    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveTab(tab)}
        className={
          isActive
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }
      >
        {children}
      </Button>
    );
  };

  const SchoolManagement = () => (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">School Management</h3>
        <p>Coming soon...</p>
      </div>
    </div>
  );

  const StoryManagement = () => (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Story Management</h3>
        <p>Coming soon...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Local Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Management
              </h1>
              <p className="text-gray-600">Manage all aspects of the system</p>
            </div>
          </div>

          {/* Local Tab Navigation */}
          <div className="flex gap-2">
            <TabButton tab="packages">Package Management</TabButton>
            <TabButton tab="schools">School Management</TabButton>
            <TabButton tab="stories">Story Management</TabButton>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {activeTab === "packages" && (
            <PackageManagement packages={packages} />
          )}
          {activeTab === "schools" && <SchoolManagement />}
          {activeTab === "stories" && <StoryManagement />}
        </div>
      </div>
    </div>
  );
}
