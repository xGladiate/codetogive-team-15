"use client";

import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function AdminDashboard() {
  return (
    <main className="p-6 space-y-6 min-h-screen bg-background">
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
            <div className="text-2xl font-bold text-foreground">$328,000</div>
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
            <div className="text-2xl font-bold text-foreground">$450,000</div>
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
                  <h4 className="font-medium text-foreground">{event.name}</h4>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
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
    </main>
  );
}
