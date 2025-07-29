/*
  # Insert Admin User

  1. Admin User Setup
    - Creates admin record for cvmahaniagaartha.sms@gmail.com
    - This will be linked to the auth user when they sign up
    
  Note: The actual auth user creation needs to be done through Supabase Auth
  This migration only creates the admin profile record
*/

-- Insert admin user record
-- Note: The ID will need to match the auth.users.id when the user signs up
-- For now, we'll use a placeholder UUID that can be updated later
INSERT INTO admins (id, name, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin CV Mahaniaga Artha', 'cvmahaniagaartha.sms@gmail.com')
ON CONFLICT (email) DO NOTHING;