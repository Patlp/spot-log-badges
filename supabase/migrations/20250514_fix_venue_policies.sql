
-- Remove any existing RLS policies for venues table
DROP POLICY IF EXISTS "Allow anyone to read venues" ON public.venues;
DROP POLICY IF EXISTS "Allow authenticated users to insert venues" ON public.venues;
DROP POLICY IF EXISTS "Allow authenticated users to update venues" ON public.venues;

-- Create new RLS policies that allow anonymous read access to venues table
CREATE POLICY "Allow anyone to read venues" 
ON public.venues 
FOR SELECT 
USING (true);

-- Allow anyone to insert venues (will be helpful for unauthenticated users' check-ins)
CREATE POLICY "Allow anyone to insert venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update venues
CREATE POLICY "Allow anyone to update venues" 
ON public.venues 
FOR UPDATE 
USING (true);
