import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/admin/SettingsForm";
import type { AppSettings } from "@/types/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Fetch settings
  let settings: AppSettings | null = null;
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("singleton_key", "default")
    .single();

  if (error) {
    // If no settings exist, that's okay - form will create them on first save
    if (error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching settings:", error);
    }
  } else {
    settings = data as AppSettings;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
        <p className="text-lg text-gray-600 mt-2">
          Configure application-wide settings and preferences.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
