import { useState } from "react";
import HeatMap from "./components/HeatMap";
import DonationImpact from "./components/DonationImpact";

// ---- Types ----
export type DistrictRow = {
  district_code: string;
  donation_need: number;
  volunteer_need: number;
};

// ---- Static dataset (edit as needed) ----
const DISTRICT_DATA: DistrictRow[] = [
  { district_code: "CENTRAL_WESTERN", donation_need: 75, volunteer_need: 30 },
  { district_code: "WAN_CHAI",        donation_need: 90, volunteer_need: 25 },
  { district_code: "EASTERN",         donation_need: 80, volunteer_need: 45 },
  { district_code: "SOUTHERN",        donation_need: 70, volunteer_need: 83 },
  { district_code: "YAU_TSIM_MONG",   donation_need: 60, volunteer_need: 27 },
  { district_code: "SHAM_SHUI_PO",    donation_need: 50, volunteer_need: 47 },
  { district_code: "KOWLOON_CITY",    donation_need: 40, volunteer_need: 34 },
  { district_code: "WONG_TAI_SIN",    donation_need: 40, volunteer_need: 44 },
  { district_code: "KWUN_TONG",       donation_need: 40, volunteer_need: 16 },
  { district_code: "TSUEN_WAN",       donation_need: 40, volunteer_need: 12 },
  { district_code: "KWAI_TSING",      donation_need: 20, volunteer_need: 15 },
  { district_code: "ISLANDS",         donation_need: 10, volunteer_need: 58 },
  { district_code: "TUEN_MUN",        donation_need: 13, volunteer_need: 48 },
  { district_code: "YUEN_LONG",       donation_need:  0, volunteer_need: 60 },
  { district_code: "NORTH",           donation_need: 27, volunteer_need: 90 },
  { district_code: "TAI_PO",          donation_need: 10, volunteer_need: 26 },
  { district_code: "SHA_TIN",         donation_need: 45, volunteer_need: 72 },
  { district_code: "SAI_KUNG",        donation_need: 20, volunteer_need: 71 },
];

export default function App() {
  const [showVolunteers, setShowVolunteers] = useState(false);

  return (
    <div style={{ padding: 16, maxWidth: 1400, margin: "0 auto" }}>
      <h2>REACH Needs Heat Map</h2>

      <div style={{ margin: "12px 0" }}>
        <button onClick={() => setShowVolunteers(false)} disabled={!showVolunteers}>
          Donation Need
        </button>
        <button
          onClick={() => setShowVolunteers(true)}
          disabled={showVolunteers}
          style={{ marginLeft: 8 }}
        >
          Volunteer Need
        </button>
      </div>

      <HeatMap
        data={DISTRICT_DATA}
        metric={showVolunteers ? "volunteer_need" : "donation_need"}
      />

      <h3 style={{ marginTop: 24 }}>Donation Impact Metric</h3>
      <DonationImpact />
    </div>
  );
}
