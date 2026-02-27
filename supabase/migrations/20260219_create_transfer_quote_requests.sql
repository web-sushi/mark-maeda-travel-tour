-- Create transfer_quote_requests table
CREATE TABLE IF NOT EXISTS transfer_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Transfer details
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  passengers INT NOT NULL,
  luggage TEXT,
  notes TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'new' NOT NULL,
  
  CONSTRAINT valid_passengers CHECK (passengers > 0)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transfer_quote_requests_transfer_id 
ON transfer_quote_requests(transfer_id);

CREATE INDEX IF NOT EXISTS idx_transfer_quote_requests_status 
ON transfer_quote_requests(status);

CREATE INDEX IF NOT EXISTS idx_transfer_quote_requests_created_at 
ON transfer_quote_requests(created_at DESC);

-- Add comments
COMMENT ON TABLE transfer_quote_requests IS 'Stores quote requests for transfers with pricing_model=quote';
COMMENT ON COLUMN transfer_quote_requests.status IS 'Status of quote request: new, contacted, quoted, booked, declined';
