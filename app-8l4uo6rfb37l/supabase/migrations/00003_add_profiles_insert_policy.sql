-- Add policy to allow users to insert their own profile during registration
CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);