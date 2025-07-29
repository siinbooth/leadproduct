/*
  # Initial Database Schema Setup

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `slug` (text, URL slug for the product)
      - `is_active` (boolean, whether product is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `admins`
      - `id` (uuid, primary key, matches auth.users.id)
      - `name` (text, admin name)
      - `email` (text, admin email)
      - `is_active` (boolean, whether admin is active)
      - `total_leads` (integer, total leads assigned)
      - `total_closings` (integer, total successful closings)
      - `total_revenue` (numeric, total revenue generated)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text, lead name)
      - `phone` (text, lead phone number)
      - `product_id` (uuid, foreign key to products)
      - `source` (text, lead source)
      - `assigned_admin_id` (uuid, foreign key to admins)
      - `follow_up_status` (text, follow up status)
      - `lead_response` (text, lead response notes)
      - `dm_response` (text, DM response notes)
      - `package_taken` (boolean, whether package was taken)
      - `revenue` (numeric, revenue from this lead)
      - `closing_date` (timestamp, when package was taken)
      - `temperature` (text, lead temperature: Hot/Warm/Cold)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data
    
  3. Initial Data
    - Insert business packages
    - Create admin user record
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  total_leads integer DEFAULT 0,
  total_closings integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  source text NOT NULL,
  assigned_admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  follow_up_status text DEFAULT 'Belum Difollow',
  lead_response text DEFAULT '',
  dm_response text DEFAULT '',
  package_taken boolean DEFAULT false,
  revenue numeric DEFAULT 0,
  closing_date timestamptz,
  temperature text DEFAULT 'Cold',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for admins
CREATE POLICY "Authenticated users can read admins"
  ON admins
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage admins"
  ON admins
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for leads
CREATE POLICY "Authenticated users can manage leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (true);

-- Insert business packages
INSERT INTO products (name, slug) VALUES
  ('Mybestea', 'mybestea'),
  ('You need mie', 'youneedmie'),
  ('Mentoast', 'mentoast'),
  ('Kopi Ibukota', 'kopiibukota'),
  ('Esteh Ibukota', 'estehibukota'),
  ('Kentang Gantenk', 'kentanggantenk'),
  ('Raja Steak', 'rajasteak'),
  ('Jafa Boga (Bubuk)', 'jafaboga'),
  ('Nice Coffee', 'nicecoffee'),
  ('Seblak Express', 'seblakexpress'),
  ('Chick Ichik', 'chickichik'),
  ('Merlumer', 'merlumer'),
  ('Chikuruyuk', 'chikuruyuk'),
  ('Tahu Nyonyor', 'tahunyonyor');

-- Function to update admin stats
CREATE OR REPLACE FUNCTION update_admin_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update admin statistics when leads change
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE admins SET
      total_leads = (
        SELECT COUNT(*) FROM leads WHERE assigned_admin_id = NEW.assigned_admin_id
      ),
      total_closings = (
        SELECT COUNT(*) FROM leads WHERE assigned_admin_id = NEW.assigned_admin_id AND package_taken = true
      ),
      total_revenue = (
        SELECT COALESCE(SUM(revenue), 0) FROM leads WHERE assigned_admin_id = NEW.assigned_admin_id AND package_taken = true
      ),
      updated_at = now()
    WHERE id = NEW.assigned_admin_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE admins SET
      total_leads = (
        SELECT COUNT(*) FROM leads WHERE assigned_admin_id = OLD.assigned_admin_id
      ),
      total_closings = (
        SELECT COUNT(*) FROM leads WHERE assigned_admin_id = OLD.assigned_admin_id AND package_taken = true
      ),
      total_revenue = (
        SELECT COALESCE(SUM(revenue), 0) FROM leads WHERE assigned_admin_id = OLD.assigned_admin_id AND package_taken = true
      ),
      updated_at = now()
    WHERE id = OLD.assigned_admin_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update admin stats
CREATE TRIGGER update_admin_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_stats();

-- Function to auto-assign leads to admins (round-robin)
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  next_admin_id uuid;
BEGIN
  -- Only auto-assign if no admin is already assigned
  IF NEW.assigned_admin_id IS NULL THEN
    -- Get the admin with the least number of leads
    SELECT id INTO next_admin_id
    FROM admins
    WHERE is_active = true
    ORDER BY total_leads ASC, created_at ASC
    LIMIT 1;
    
    -- Assign the lead to the selected admin
    IF next_admin_id IS NOT NULL THEN
      NEW.assigned_admin_id = next_admin_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign leads
CREATE TRIGGER auto_assign_lead_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();