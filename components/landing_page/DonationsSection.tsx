// components/DonationsSection.tsx
import { Package } from "@/types/database";
import PackageCard from "../packages/PackageCard";
import Image from "next/image";

interface Props {
  packages: Package[];
}

export default function DonationsSection({ packages }: Props) {
  const corePackages = packages.filter((pkg) => pkg.type === "core");
  const communityPackages = packages.filter((pkg) => pkg.type === "community");

  return (
    <div id="donations-section" className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Core Packages Section */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Mission and Impact of Reach
              </h2>
              <div className="relative h-64 mb-6">
                <Image
                  src="/assets/Content_Individual.png"
                  alt="Individual receiving a package"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <h3 className="text-2xl font-bold mb-6">
                Empower a Child, One Step at a Time
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Description:
                  </h4>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Your monthly or weekly support helps provide the little
                    things that mean the world to a child — storybooks, healthy
                    snacks, art supplies, and learning materials. These small,
                    steady contributions ensure every child can learn, play, and
                    grow with dignity.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Impact Highlight:
                  </h4>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Thanks to ongoing individual sponsorships, children in our
                    partner kindergartens have received fresh reading books,
                    nutritious snacks, and classroom supplies. Parents have
                    shared that their children are more excited to learn and
                    eager to go to school every day. (Images provided to
                    showcase smiling children reading, playing, and creating
                    artwork).
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">Core package Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {corePackages
                  .slice()
                  .sort((a, b) => {
                    if (a.amount == null && b.amount == null) return 0;
                    if (a.amount == null) return 1;
                    if (b.amount == null) return -1;
                    return a.amount - b.amount;
                  })
                  .map((pkg) => (
                    <PackageCard key={pkg.id} package={pkg} />
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Community Packages Section */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-4xl font-bold mb-6">Community Packages</h2>
              <div className="relative h-64 mb-6">
                <Image
                  src="/assets/Content_Classroom2.png"
                  alt="Community packages"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <h3 className="text-2xl font-bold mb-6">
                Empower a Child, One Step at a Time
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Description:
                  </h4>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Your monthly or weekly support helps provide the little
                    things that mean the world to a child — storybooks, healthy
                    snacks, art supplies, and learning materials. These small,
                    steady contributions ensure every child can learn, play, and
                    grow with dignity.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Impact Highlight:
                  </h4>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Thanks to ongoing individual sponsorships, children in our
                    partner kindergartens have received fresh reading books,
                    nutritious snacks, and classroom supplies. Parents have
                    shared that their children are more excited to learn and
                    eager to go to school every day. (Images provided to
                    showcase smiling children reading, playing, and creating
                    artwork).
                  </p>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Community-driven packages that address specific neighborhood
                needs. These packages are designed with input from local
                residents to ensure cultural relevance and maximum
                effectiveness.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communityPackages
                .slice()
                .sort((a, b) => {
                  if (a.amount == null && b.amount == null) return 0;
                  if (a.amount == null) return 1;
                  if (b.amount == null) return -1;
                  return a.amount - b.amount;
                })
                .map((pkg) => (
                  <PackageCard key={pkg.id} package={pkg} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
