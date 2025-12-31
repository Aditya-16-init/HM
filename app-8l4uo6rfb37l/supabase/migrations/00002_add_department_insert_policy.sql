-- Add policy to allow authenticated users to insert departments
CREATE POLICY "Authenticated users can create departments" ON departments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add policy to allow authenticated users to update departments (for merging subjects)
CREATE POLICY "Authenticated users can update departments" ON departments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);