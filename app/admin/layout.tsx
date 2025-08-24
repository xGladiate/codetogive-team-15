"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

type MonthlyData = { month: string; donations: number; projected: number };
type DonorTypeData = { name: string; value: number; color: string };

const upcomingEvents = [
  { name: "Annual Gala", date: "Dec 15, 2024", projected: "$125,000" },
  { name: "Online Campaign", date: "Jan 10, 2025", projected: "$75,000" },
  { name: "Corporate Partnership", date: "Feb 1, 2025", projected: "$200,000" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalDonations: number;
    activeDonors: number;
    avgDonation: number;
    monthlyData: MonthlyData[];
    donorTypeData: DonorTypeData[];
  }>({
    totalDonations: 0,
    activeDonors: 0,
    avgDonation: 0,
    monthlyData: [],
    donorTypeData: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchStats = async () => {
      setLoading(true);

      // Fetch all donations
      const { data: donations, error } = await supabase
        .from("donations")
        .select("amount, donor_id, created_at, type");

      if (error) {
        console.error("Error fetching donations:", error);
        setLoading(false);
        return;
      }

      const monthOrder = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];


      // Total Donations & Average
      const amounts = donations.map((d) => parseFloat(d.amount));
      const totalDonations = amounts.reduce((a, b) => a + b, 0);
      const avgDonation =
        amounts.length > 0 ? totalDonations / amounts.length : 0;

      // Active Donors
      const uniqueDonors = new Set(donations.map((d) => d.donor_id));
      const activeDonors = uniqueDonors.size;

      // Monthly Donations
      const monthlyMap: Record<string, number> = {};
      donations.forEach((d) => {
        const date = new Date(d.created_at);
        const month = date.toLocaleString("default", { month: "short" });
        monthlyMap[month] = (monthlyMap[month] || 0) + parseFloat(d.amount);
      });
      const monthlyData = Object.keys(monthlyMap).map((month) => ({
        month,
        donations: Math.round(monthlyMap[month]),
        projected: Math.round(monthlyMap[month] * 1.1), // Example projection
      })).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

      // Donor Type Distribution
      const typeMap: Record<string, number> = {};
      donations.forEach((d) => {
        typeMap[d.type] = (typeMap[d.type] || 0) + 1;
      });
      const colors = [
        "hsl(160 84% 39%)",
        "hsl(160 60% 60%)",
        "hsl(160 40% 80%)",
      ];
      const donorTypeData = Object.keys(typeMap).map((type, index) => ({
        name: type,
        value: typeMap[type],
        color: colors[index % colors.length],
      }));

      setStats({
        totalDonations,
        activeDonors,
        avgDonation,
        monthlyData,
        donorTypeData,
      });

      setLoading(false);
    };

    fetchStats();

    const channel = supabase
      .channel("donations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "donations" },
        (payload) => {
          console.log("Realtime update received:", payload);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </main>
    );
  }

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
            <div className="text-2xl font-bold text-foreground">
              ${Math.round(stats.totalDonations).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Updated in real time
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
            <div className="text-2xl font-bold text-foreground">
              {stats.activeDonors}
            </div>
            <p className="text-xs text-muted-foreground">Unique donors</p>
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
              ${(Math.round(stats.totalDonations * 1.1).toLocaleString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Goal: ${(Math.round(stats.totalDonations * 1.25).toLocaleString())}
            </p>
            <Progress
              value={(stats.totalDonations / (stats.totalDonations * 1.25)) * 100}
              className="mt-2"
            />
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
            <div className="text-2xl font-bold text-foreground">
              ${stats.avgDonation.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Average per donation</p>
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
                <BarChart data={stats.monthlyData}>
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
                    data={stats.donorTypeData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {stats.donorTypeData.map((entry, index) => (
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
