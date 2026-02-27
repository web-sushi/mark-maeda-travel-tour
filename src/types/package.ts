import { VehicleRates } from "./vehicle";

export interface PackageItem {
  type: string;
  id: string;
  [key: string]: any;
}

export interface Package {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  cover_image_path?: string | null;
  gallery_image_paths?: string[] | null;
  region?: string | null;
  items: PackageItem[];
  base_price_jpy: number;
  vehicle_rates?: VehicleRates | null;
  status: "active" | "off_season" | "archived";
  images: string[];
  display_order: number;
  created_at?: string;
  updated_at?: string;
}
