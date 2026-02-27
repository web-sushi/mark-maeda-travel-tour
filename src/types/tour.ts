import { VehicleRates } from "./vehicle";

export interface Tour {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency?: string;
  short_description?: string | null;
  description?: string | null;
  imageUrl?: string;
  images?: string[];
  cover_image_path?: string | null;
  gallery_image_paths?: string[] | null;
  region?: string | null;
  duration_hours?: number | null;
  base_price_jpy?: number | null;
  vehicle_rates?: VehicleRates | null;
  status?: string | null;
  highlights?: string[] | null;
}
