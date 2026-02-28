-- Migration: Add admin_notification_email column to app_settings
-- Date: 2026-02-10
-- Purpose: Add new configurable admin notification email field with self-send safeguard

-- Add new column for admin notification email
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS admin_notification_email TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN public.app_settings.admin_notification_email IS 
  'Primary email address for admin notifications. Takes priority over admin_notify_email (deprecated). Must differ from EMAIL_FROM to avoid email provider self-send filtering.';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_app_settings_admin_notification_email 
  ON public.app_settings(admin_notification_email);

-- Migrate existing admin_notify_email values to new field if present
UPDATE public.app_settings
SET admin_notification_email = admin_notify_email
WHERE admin_notify_email IS NOT NULL 
  AND admin_notification_email IS NULL;
