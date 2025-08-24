// src/data/districtCodes.ts

// ---- Allowed codes ----
export const ALLOWED_CODES = [
  "CENTRAL_WESTERN","WAN_CHAI","EASTERN","SOUTHERN",
  "YAU_TSIM_MONG","SHAM_SHUI_PO","KOWLOON_CITY","WONG_TAI_SIN","KWUN_TONG",
  "TSUEN_WAN","KWAI_TSING","ISLANDS","TUEN_MUN","YUEN_LONG",
  "NORTH","TAI_PO","SHA_TIN","SAI_KUNG",
] as const;

export type DistrictCode = typeof ALLOWED_CODES[number];

export const NAME_TO_CODE = {
  "Central and Western": "CENTRAL_WESTERN",
  "Wan Chai":            "WAN_CHAI",
  "Eastern":             "EASTERN",
  "Southern":            "SOUTHERN",
  "Yau Tsim Mong":       "YAU_TSIM_MONG",
  "Sham Shui Po":        "SHAM_SHUI_PO",
  "Kowloon City":        "KOWLOON_CITY",
  "Wong Tai Sin":        "WONG_TAI_SIN",
  "Kwun Tong":           "KWUN_TONG",
  "Tsuen Wan":           "TSUEN_WAN",
  "Kwai Tsing":          "KWAI_TSING",
  "Islands":             "ISLANDS",
  "Tuen Mun":            "TUEN_MUN",
  "Yuen Long":           "YUEN_LONG",
  "North":               "NORTH",
  "Tai Po":              "TAI_PO",
  "Sha Tin":             "SHA_TIN",
  "Sai Kung":            "SAI_KUNG",
} as const satisfies Record<string, DistrictCode>;

// ---- Helpers ----
type PropsLike = {
  name?: string;
  District?: string;
  ENAME?: string;
  CNAME?: string;
};

const normalizeName = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  return raw
    .toLowerCase()
    .split(" ")
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
};

export function districtCodeFromProps(props: PropsLike = {}): DistrictCode | undefined {
  const candidates = [
    props.name,
    props.District,
    normalizeName(props.ENAME),
    normalizeName(props.CNAME),
  ];
  for (const n of candidates) {
    if (n && n in NAME_TO_CODE) {
      return NAME_TO_CODE[n as keyof typeof NAME_TO_CODE];
    }
  }
  return undefined;
}

// Optional convenience:
export const ALLOWED_SET = new Set<string>(ALLOWED_CODES);
export const isAllowedCode = (code: string): code is DistrictCode =>
  ALLOWED_SET.has(code.toUpperCase());
