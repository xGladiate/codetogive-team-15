export interface Package {
  id: number;
  name: string;
  description: string;
  picture_url: string;
  type: 'core' | 'community';
  amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NewPackage {
  name: string;
  description: string;
  picture_url: string;
  type: 'core' | 'community';
  amount?: number;
  additionalDescription?: string;
}