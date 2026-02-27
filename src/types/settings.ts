/**
 * App Settings Type Definitions
 */

export interface EmailToggles {
  booking_received_customer?: boolean;
  booking_received_admin?: boolean;
  booking_confirmed?: boolean;
  payment_paid?: boolean;
  booking_cancelled?: boolean;
}

export interface AppSettings {
  id: string;
  singleton_key: string;
  business_name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  admin_notify_email?: string | null;
  timezone: string;
  email_toggles: EmailToggles;
  updated_at: string;
  created_at: string;
}

export interface AppSettingsFormData {
  business_name: string;
  support_email: string;
  support_phone: string;
  admin_notify_email: string;
  timezone: string;
  email_toggles: EmailToggles;
}
