export interface Package {
  id: string;
  name: string;
  description: string;
  amount: number;
  picture_url: string;
  type: "core" | "community";
  created_at: string;
}

export interface Donation {
  id: string;
  amount: number;
  donor_id: number;
  school_id: number;
  package_id: number;
  remarks: string | null;
  type: "one_off" | "recurring";
  payment_method: "Stripe" | "Bank"
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  neighborhood: string;
  total_funding: number;
  created_at: string;
}
