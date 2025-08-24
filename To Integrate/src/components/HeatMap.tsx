import { useEffect, useMemo, useState, type ReactElement } from "react";
import * as L from "leaflet";
import type { Layer, Path, PathOptions } from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry, GeoJsonObject } from "geojson";
import { districtCodeFromProps } from "../data/districtCodes";


// ---------- Types ----------
type DistrictRow = {
  district_code: string;
  donation_need?: number;   // 0–100
  volunteer_need?: number;  // 0–100
};

type HeatMapProps = {
  data: DistrictRow[];
  metric?: "donation_need" | "volunteer_need";
};

// ---------- Utils ----------
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

const colorScale = (v: number): string => {
  const s = clamp(v);
  if (s > 80) return "#800026";
  if (s > 60) return "#BD0026";
  if (s > 40) return "#E31A1C";
  if (s > 20) return "#FC4E2A";
  if (s > 10) return "#FD8D3C";
  if (s > 0) return "#FEB24C";
  return "#FFEDA0";
};

function prettyName(props: any): string {
  if (typeof props?.District === "string") return props.District;
  if (typeof props?.ENAME === "string")
    return props.ENAME.toLowerCase()
      .split(" ")
      .map((w: string) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  if (typeof props?.CNAME === "string") return props.CNAME;
  if (typeof props?.name === "string") return props.name;
  return "Unknown";
}

// ---------- Fit map to GeoJSON ----------
function FitToGeo({ data }: { data: FeatureCollection | null }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    const layer = L.geoJSON(data as GeoJsonObject);
    const b = layer.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [12, 12] });
  }, [data, map]);
  return null;
}

// ---------- Component ----------
export default function HeatMap({
  data,
  metric = "donation_need",
}: HeatMapProps){
  const [geo, setGeo] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/hk_districts.geo.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load geojson: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        // Light guard: ensure it's a FeatureCollection
        if (json && json.type === "FeatureCollection") {
          setGeo(json as FeatureCollection);
        } else {
          setGeo(null);
        }
      })
      .catch(() => !cancelled && setGeo(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const byCode = useMemo<Record<string, DistrictRow>>(() => {
    const entries = data.map((d) => [d.district_code, d] as const);
    return Object.fromEntries(entries);
  }, [data]);

  const style = (feature?: Feature<Geometry, any>): PathOptions => {
    const code = districtCodeFromProps(feature?.properties || {});
    const v = (code && (byCode[code]?.[metric] ?? 0)) || 0;
    return {
      fillColor: colorScale(v),
      weight: 1,
      color: "#ffffff",
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, any>, layer: Layer) => {
    const code = districtCodeFromProps(feature?.properties || {});
    const row = code ? byCode[code] : undefined;
    const value = row ? (row[metric] ?? 0) : 0;
    const name = prettyName(feature?.properties || {});
    layer.bindTooltip(`${name}\n${metric === "donation_need" ? "Donation need" : "Volunteer need"}: ${value}`);

    // highlight on hover
    const setRestyle = (f: Feature<Geometry, any>) => {
      const c = districtCodeFromProps(f?.properties || {});
      const v = (c && (byCode[c]?.[metric] ?? 0)) || 0;
      (layer as Path).setStyle({
        fillColor: colorScale(v),
        weight: 1,
        color: "#ffffff",
        fillOpacity: 0.85,
      });
    };

    layer.on({
      mouseover: () => (layer as Path).setStyle({ weight: 2, color: "#333" }),
      mouseout: () => setRestyle(feature),
    });
  };

  return (
    <div style={{ width: 520, height: 520, position: "relative" }}>
      {!geo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            zIndex: 1,
            background: "#fff8",
          }}
        >
          <div>
            Place <b>hk_districts.geo.json</b> into the <b>public/</b> folder to
            load the map.
          </div>
        </div>
      )}

      <MapContainer
        center={[22.32, 114.17]}
        zoom={10}
        keyboard={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geo && (
          <GeoJSON
            key={metric} // remounts to reset hover when metric changes
            data={geo as unknown as FeatureCollection}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
        {geo && <FitToGeo data={geo} />}
      </MapContainer>

      <Legend />
    </div>
  );
}

// ---------- Legend ----------
function Legend(){
  const items: { c: string; label: string }[] = [
    { c: "#800026", label: "81–100" },
    { c: "#BD0026", label: "61–80" },
    { c: "#E31A1C", label: "41–60" },
    { c: "#FC4E2A", label: "21–40" },
    { c: "#FD8D3C", label: "11–20" },
    { c: "#FEB24C", label: "1–10" },
    { c: "#FFEDA0", label: "0" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        background: "white",
        padding: 10,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
        fontSize: 12,
        lineHeight: 1.2,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Need level</div>
      {items.map((it, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}
        >
          <span style={{ width: 14, height: 14, background: it.c, border: "1px solid #ccc" }} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
