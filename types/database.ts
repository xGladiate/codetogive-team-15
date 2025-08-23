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

export interface RuleConfig {
  threshold: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string;
  rule_type: "donation_count" | "distinct_schools" | "streak_days" | "total_amount";
  rule_config: RuleConfig;
};

export interface UserBadges {
  id: string;
  profile_id: string;
  badge_id: string;
  achieved_at: string;
}
