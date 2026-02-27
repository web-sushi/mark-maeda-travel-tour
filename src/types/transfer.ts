import { VehicleRates } from "./vehicle";

export interface Transfer {
  id: string;
  slug: string;
  title: string;
  category: string;
  from_area?: string | null;
  to_area?: string | null;
  short_description?: string | null;
  description?: string | null;
  cover_image_path?: string | null;
  gallery_image_paths?: string[] | null;
  base_price_jpy: number;
  vehicle_rates?: VehicleRates | null;
  notes?: string | null;
  status: "active" | "off_season" | "archived";
  images: string[];
  display_order: number;
  created_at?: string;
  updated_at?: string;
}
