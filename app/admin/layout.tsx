"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { TrendingUp, DollarSign, Users, Target, Calendar } from "lucide-react";

const monthlyData = [
  { month: "Jan", donations: 45000, projected: 50000 },
  { month: "Feb", donations: 52000, projected: 55000 },
  { month: "Mar", donations: 48000, projected: 52000 },
  { month: "Apr", donations: 61000, projected: 58000 },
  { month: "May", donations: 55000, projected: 60000 },
  { month: "Jun", donations: 67000, projected: 65000 },
];

const donorTypeData = [
  { name: "Individual", value: 65, color: "hsl(160 84% 39%)" },
  { name: "Corporate", value: 25, color: "hsl(160 60% 60%)" },
  { name: "Foundation", value: 10, color: "hsl(160 40% 80%)" },
];

const upcomingEvents = [
  { name: "Annual Gala", date: "Dec 15, 2024", projected: "$125,000" },
  { name: "Online Campaign", date: "Jan 10, 2025", projected: "$75,000" },
  { name: "Corporate Partnership", date: "Feb 1, 2025", projected: "$200,000" },
];

const schoolsData = [
  {
    id: 1,
    name: "Lincoln Elementary",
    district: "Central District",
    students: 450,
    status: "Active",
  },
  {
    id: 2,
    name: "Washington High School",
    district: "North District",
    students: 1200,
    status: "Active",
  },
  {
    id: 3,
    name: "Roosevelt Middle School",
    district: "South District",
    students: 680,
    status: "Active",
  },
  {
    id: 4,
    name: "Jefferson Academy",
    district: "East District",
    students: 320,
    status: "Inactive",
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "school">(
    "dashboard"
  );

  const [schools, setSchools] = useState(schoolsData);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [newSchool, setNewSchool] = useState({
    name: "",
    district: "",
    students: "",
    status: "Active",
  });

  const handleAddSchool = () => {
    if (newSchool.name && newSchool.district && newSchool.students) {
      const school = {
        id: Math.max(...schools.map((s) => s.id)) + 1,
        name: newSchool.name,
        district: newSchool.district,
        students: Number.parseInt(newSchool.students),
        status: newSchool.status,
      };
      setSchools([...schools, school]);
      setNewSchool({ name: "", district: "", students: "", status: "Active" });
      setIsAddingSchool(false);
    }
  };

  const handleEditSchool = (school: any) => {
    setEditingSchool(school);
    setNewSchool({
      name: school.name,
      district: school.district,
      students: school.students.toString(),
      status: school.status,
    });
  };

  const handleUpdateSchool = () => {
    if (newSchool.name && newSchool.district && newSchool.students) {
      setSchools(
        schools.map((school) =>
          school.id === editingSchool.id
            ? {
                ...school,
                name: newSchool.name,
                district: newSchool.district,
                students: Number.parseInt(newSchool.students),
                status: newSchool.status,
              }
            : school
        )
      );
      setEditingSchool(null);
      setNewSchool({ name: "", district: "", students: "", status: "Active" });
    }
  };

  const handleDeleteSchool = (id: number) => {
    setSchools(schools.filter((school) => school.id !== id));
  };

  const cancelEdit = () => {
    setEditingSchool(null);
    setIsAddingSchool(false);
    setNewSchool({ name: "", district: "", students: "", status: "Active" });
  };

  return (
    <main className="p-6 space-y-6 min-h-screen bg-background flex flex-col">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === "dashboard" ? "default" : "outline"}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </Button>
        <Button
          variant={activeTab === "school" ? "default" : "outline"}
          onClick={() => setActiveTab("school")}
        >
          School Management
        </Button>
      </div>

      {/* ---------- Dashboard Tab ---------- */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Donations
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  $328,000
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Donors
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">1,247</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary">+8.2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projected Funding
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  $450,000
                </div>
                <p className="text-xs text-muted-foreground">
                  Goal: $500,000 by Dec 2024
                </p>
                <Progress value={90} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Donation
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">$263</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary">+5.1%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Donations */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>
                  Actual donations vs projected funding over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="donations" fill="hsl(160 84% 39%)" />
                      <Bar dataKey="projected" fill="hsl(160 60% 60%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Donor Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Donor Distribution</CardTitle>
                <CardDescription>
                  Breakdown of donations by donor type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donorTypeData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {donorTypeData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Fundraising Events
              </CardTitle>
              <CardDescription>
                Scheduled events and their projected contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-foreground">
                        {event.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {event.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {event.projected}
                      </p>
                      <p className="text-xs text-muted-foreground">Projected</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---------- School Management Tab ---------- */}
      {activeTab === "school" && (
        <div className="space-y-6">
          {/* School Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                School Management
              </h2>
              <p className="text-muted-foreground">
                Manage schools in the system
              </p>
            </div>
            <Button
              onClick={() => setIsAddingSchool(true)}
              disabled={isAddingSchool || editingSchool}
            >
              Add New School
            </Button>
          </div>

          {/* Add/Edit Form */}
          {(isAddingSchool || editingSchool) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingSchool ? "Edit School" : "Add New School"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={newSchool.name}
                      onChange={(e) =>
                        setNewSchool({ ...newSchool, name: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      District
                    </label>
                    <input
                      type="text"
                      value={newSchool.district}
                      onChange={(e) =>
                        setNewSchool({ ...newSchool, district: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter district"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Number of Students
                    </label>
                    <input
                      type="number"
                      value={newSchool.students}
                      onChange={(e) =>
                        setNewSchool({ ...newSchool, students: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter student count"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Status
                    </label>
                    <select
                      value={newSchool.status}
                      onChange={(e) =>
                        setNewSchool({ ...newSchool, status: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={
                      editingSchool ? handleUpdateSchool : handleAddSchool
                    }
                  >
                    {editingSchool ? "Update School" : "Add School"}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schools Table */}
          <Card>
            <CardHeader>
              <CardTitle>Schools List</CardTitle>
              <CardDescription>All schools in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">
                        School Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">
                        District
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">
                        Students
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((school) => (
                      <tr
                        key={school.id}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <td className="py-3 px-4 text-foreground">
                          {school.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {school.district}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {school.students.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              school.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {school.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSchool(school)}
                              disabled={isAddingSchool || editingSchool}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSchool(school.id)}
                              disabled={isAddingSchool || editingSchool}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
