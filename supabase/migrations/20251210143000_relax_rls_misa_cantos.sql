-- Temporary fix: Relax RLS on misa_cantos for INSERT
-- Drop the overly restrictive policy that checks owner
DROP POLICY IF EXISTS "Authenticated users can insert mass songs" ON public.misa_cantos;

-- New permissive policy: Allow any authenticated user to insert misa_cantos
-- Note: This is temporary for testing/development. Should be reverted with proper RLS in production.
CREATE POLICY "Authenticated users can insert mass songs" ON public.misa_cantos 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Also relax UPDATE and DELETE policies
DROP POLICY IF EXISTS "Authenticated users can update mass songs" ON public.misa_cantos;
DROP POLICY IF EXISTS "Users can delete their own mass songs" ON public.misa_cantos;

CREATE POLICY "Authenticated users can update mass songs" ON public.misa_cantos 
  FOR UPDATE TO authenticated 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete mass songs" ON public.misa_cantos 
  FOR DELETE TO authenticated 
  USING (true);
