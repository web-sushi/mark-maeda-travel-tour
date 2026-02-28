"use client";

import { useState } from "react";
import type { AppSettings, EmailToggles } from "@/types/settings";
import Button from "@/components/ui/Button";

interface SettingsFormProps {
  initialSettings: AppSettings | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    business_name: initialSettings?.business_name || "",
    support_email: initialSettings?.support_email || "",
    support_phone: initialSettings?.support_phone || "",
    admin_notify_email: initialSettings?.admin_notify_email || "",
    admin_notification_email: initialSettings?.admin_notification_email || "",
    timezone: initialSettings?.timezone || "Asia/Tokyo",
    email_toggles: initialSettings?.email_toggles || {
      booking_received_customer: true,
      booking_received_admin: true,
      booking_confirmed: true,
      payment_paid: true,
      booking_cancelled: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (key: keyof EmailToggles) => {
    setFormData((prev) => ({
      ...prev,
      email_toggles: {
        ...prev.email_toggles,
        [key]: !prev.email_toggles[key],
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Business Info */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Business Information
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="business_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Business Name
            </label>
            <input
              type="text"
              id="business_name"
              value={formData.business_name}
              onChange={(e) =>
                setFormData({ ...formData, business_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <label
              htmlFor="support_email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Support Email
            </label>
            <input
              type="email"
              id="support_email"
              value={formData.support_email}
              onChange={(e) =>
                setFormData({ ...formData, support_email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="support@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="support_phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Support Phone
            </label>
            <input
              type="tel"
              id="support_phone"
              value={formData.support_phone}
              onChange={(e) =>
                setFormData({ ...formData, support_phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+81-XXX-XXXX-XXXX"
            />
          </div>

          <div>
            <label
              htmlFor="admin_notify_email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Admin Notification Email (Deprecated)
            </label>
            <input
              type="email"
              id="admin_notify_email"
              value={formData.admin_notify_email}
              onChange={(e) =>
                setFormData({ ...formData, admin_notify_email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              placeholder="admin@example.com"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Deprecated: Use "Admin Notification Email" field below instead
            </p>
          </div>

          <div>
            <label
              htmlFor="admin_notification_email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Admin Notification Email *
            </label>
            <input
              type="email"
              id="admin_notification_email"
              value={formData.admin_notification_email}
              onChange={(e) =>
                setFormData({ ...formData, admin_notification_email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="notifications@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Primary email for booking notifications. Fallback: env ADMIN_EMAIL. 
              <span className="font-semibold text-amber-600"> Must differ from sender email (EMAIL_FROM) to avoid filtering.</span>
            </p>
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Toggles */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Email Notifications
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Enable or disable specific email notifications.
        </p>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email_toggles.booking_received_customer ?? true}
              onChange={() => handleToggleChange("booking_received_customer")}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Booking Received (Customer)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email_toggles.booking_received_admin ?? true}
              onChange={() => handleToggleChange("booking_received_admin")}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Booking Received (Admin)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email_toggles.booking_confirmed ?? true}
              onChange={() => handleToggleChange("booking_confirmed")}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Booking Confirmed
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email_toggles.payment_paid ?? true}
              onChange={() => handleToggleChange("payment_paid")}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Payment Marked Paid</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.email_toggles.booking_cancelled ?? true}
              onChange={() => handleToggleChange("booking_cancelled")}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Booking Cancelled
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
