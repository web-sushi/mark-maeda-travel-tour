-- Add public_view_token column to bookings table
-- This token allows guests to view their booking after payment without authentication

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS public_view_token TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_bookings_public_view_token 
ON bookings(public_view_token) 
WHERE public_view_token IS NOT NULL;

-- Add comment explaining the column's purpose
COMMENT ON COLUMN bookings.public_view_token IS 
'Random token for guest access to booking success/track pages. Generated once at booking creation.';
