-- Alternative approach: Use a more robust RLS policy with explicit user checks
-- This policy checks if the misa's usuario_id exists in the database and matches auth.uid()

DROP POLICY IF EXISTS "Authenticated users can insert mass songs" ON public.misa_cantos;

-- More explicit policy that first checks the misa exists and belongs to user
CREATE POLICY "Authenticated users can insert mass songs" ON public.misa_cantos 
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- Check that the misa exists
    EXISTS (
      SELECT 1 FROM public.misas
      WHERE misas.id = misa_cantos.misa_id
        AND misas.usuario_id = auth.uid()
    )
    -- Also allow if user has admin role
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );
