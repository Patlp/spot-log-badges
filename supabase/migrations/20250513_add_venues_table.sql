
CREATE TABLE IF NOT EXISTS public.venues (
  place_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  types TEXT[] NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Allow anonymous read access to venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- RLS policy to allow anyone to read venues
CREATE POLICY "Allow anyone to read venues" 
ON public.venues 
FOR SELECT 
USING (true);

-- Only authenticated users can insert or update venues
CREATE POLICY "Allow authenticated users to insert venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update venues" 
ON public.venues 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create an index for geographic queries
CREATE INDEX IF NOT EXISTS venues_lat_lng_idx ON public.venues (latitude, longitude);

-- Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_updated_at_trigger
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
