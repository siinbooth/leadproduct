/*
  # Lead Management System Database Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `slug` (text, unique URL slug)
      - `is_active` (boolean, product status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `admins`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, admin name)
      - `email` (text, admin email)
      - `is_active` (boolean, admin status)
      - `total_leads` (integer, lead count)
      - `total_closings` (integer, closing count)
      - `total_revenue` (decimal, revenue amount)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text, lead name)
      - `phone` (text, phone number)
      - `product_id` (uuid, references products)
      - `source` (text, info source)
      - `assigned_admin_id` (uuid, references admins)
      - `follow_up_status` (text, status)
      - `lead_response` (text, response notes)
      - `dm_response` (text, DM notes)
      - `package_taken` (boolean, conversion status)
      - `revenue` (decimal, revenue amount)
      - `closing_date` (timestamp, closing date)
      - `temperature` (text, lead quality)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access
    - Add policies for public form submission
</sql>

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  total_leads integer DEFAULT 0,
  total_closings integer DEFAULT 0,
  total_revenue decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  source text NOT NULL,
  assigned_admin_id uuid REFERENCES admins(id),
  follow_up_status text DEFAULT 'Belum Difollow',
  lead_response text DEFAULT '',
  dm_response text DEFAULT '',
  package_taken boolean DEFAULT false,
  revenue decimal(10,2) DEFAULT 0,
  closing_date timestamptz,
  temperature text DEFAULT 'Warm',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE admins.id = auth.uid()
  ));

-- Admins policies
CREATE POLICY "Admins can read admin data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update their own data"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Leads policies
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can manage leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE admins.id = auth.uid()
  ));

-- Insert sample products
INSERT INTO products (name, slug) VALUES
  ('MyBestea Premium Package', 'mybestea'),
  ('YouNeedMie Business Starter', 'youneedmie'),
  ('Kopi Ibukota Franchise', 'kopiibukota'),
  ('Chick Ichik Package', 'chickichik')
ON CONFLICT (slug) DO NOTHING;

-- Function to auto-assign leads to admins (round-robin)
CREATE OR REPLACE FUNCTION assign_lead_to_admin()
RETURNS TRIGGER AS $$
DECLARE
  next_admin_id uuid;
BEGIN
  -- Get the admin with the least leads who is active
  SELECT id INTO next_admin_id
  FROM admins
  WHERE is_active = true
  ORDER BY total_leads ASC, created_at ASC
  LIMIT 1;
  
  IF next_admin_id IS NOT NULL THEN
    NEW.assigned_admin_id = next_admin_id;
    
    -- Update admin's total leads count
    UPDATE admins 
    SET total_leads = total_leads + 1,
        updated_at = now()
    WHERE id = next_admin_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-assignment
DROP TRIGGER IF EXISTS auto_assign_lead ON leads;
CREATE TRIGGER auto_assign_lead
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION assign_lead_to_admin();

-- Function to update admin stats when lead is updated
CREATE OR REPLACE FUNCTION update_admin_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- If package_taken changed from false to true
  IF OLD.package_taken = false AND NEW.package_taken = true THEN
    UPDATE admins 
    SET total_closings = total_closings + 1,
        total_revenue = total_revenue + COALESCE(NEW.revenue, 0),
        updated_at = now()
    WHERE id = NEW.assigned_admin_id;
  -- If package_taken changed from true to false
  ELSIF OLD.package_taken = true AND NEW.package_taken = false THEN
    UPDATE admins 
    SET total_closings = total_closings - 1,
        total_revenue = total_revenue - COALESCE(OLD.revenue, 0),
        updated_at = now()
    WHERE id = NEW.assigned_admin_id;
  -- If only revenue changed and package is taken
  ELSIF NEW.package_taken = true AND OLD.revenue != NEW.revenue THEN
    UPDATE admins 
    SET total_revenue = total_revenue - COALESCE(OLD.revenue, 0) + COALESCE(NEW.revenue, 0),
        updated_at = now()
    WHERE id = NEW.assigned_admin_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating admin stats
DROP TRIGGER IF EXISTS update_admin_stats_trigger ON leads;
CREATE TRIGGER update_admin_stats_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_stats();