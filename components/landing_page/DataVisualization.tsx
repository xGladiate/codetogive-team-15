import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function DataVisualization() {
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, total_funding")
    .order("total_funding", { ascending: false });

  const maxFunding = Math.max(
    ...(schools?.map((school) => school.total_funding) || [0])
  );

  return (
    <div className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            School Funding Impact
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how your donations are making a difference across our partner
            schools
          </p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              {schools?.map((school) => {
                const percentage = (school.total_funding / maxFunding) * 100;

                return (
                  <div
                    key={school.id}
                    className="group hover:scale-[1.02] transition-transform duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-800 truncate">
                        {school.name}
                      </h3>
                      <span className="text-2xl font-bold text-gray-800">
                        HK${school.total_funding.toLocaleString()}
                      </span>
                    </div>

                    <Progress value={percentage} className="h-6" />
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <CardTitle className="text-2xl font-bold text-blue-600">
                      {schools?.length || 0}
                    </CardTitle>
                    <p className="text-sm text-blue-800 mt-1">
                      Schools Supported
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4 text-center">
                    <CardTitle className="text-2xl font-bold text-green-600">
                      HK$
                      {schools
                        ?.reduce((sum, school) => sum + school.total_funding, 0)
                        .toLocaleString() || "0"}
                    </CardTitle>
                    <p className="text-sm text-green-800 mt-1">
                      Total Funding Raised
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <CardTitle className="text-2xl font-bold text-purple-600">
                      HK$
                      {Math.round(
                        (schools?.reduce(
                          (sum, school) => sum + school.total_funding,
                          0
                        ) || 0) / (schools?.length || 1)
                      ).toLocaleString()}
                    </CardTitle>
                    <p className="text-sm text-purple-800 mt-1">
                      Average per School
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
