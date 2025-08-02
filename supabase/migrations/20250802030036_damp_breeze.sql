/*
  # Enhanced Lead Management System

  1. New Tables
    - `sub_products` - Product variants with pricing
    - `handle_customers` - Closed leads management
    - `admin_targets` - Monthly/daily targets for admins
    - Enhanced `admins` table with roles and WhatsApp numbers

  2. Updated Tables
    - `leads` - Enhanced with stage, payment info, and sub-product selection
    - `admins` - Added role, whatsapp_number, is_whatsapp_active fields

  3. Security
    - Row Level Security policies for role-based access
    - Separate access for admin, handle_customer, and super_admin roles

  4. Functions
    - Auto-assignment with WhatsApp integration
    - Handle customer creation on lead completion
    - Target tracking functions
*/

-- Add role enum type
CREATE TYPE user_role AS ENUM ('admin', 'handle_customer', 'super_admin');
CREATE TYPE lead_stage AS ENUM ('on_progress', 'loss', 'closing');
CREATE TYPE payment_type AS ENUM ('full_transfer', 'cod', 'dp');

-- Update admins table with new fields
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'admin';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_whatsapp_active boolean DEFAULT true;

-- Create sub_products table
CREATE TABLE IF NOT EXISTS sub_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create handle_customers table
CREATE TABLE IF NOT EXISTS handle_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  source text NOT NULL,
  sub_product_name text NOT NULL,
  assigned_hc_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  is_contacted boolean DEFAULT false,
  contacted_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_targets table
CREATE TABLE IF NOT EXISTS admin_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id) ON DELETE CASCADE,
  target_month integer NOT NULL,
  target_year integer NOT NULL,
  monthly_target integer DEFAULT 0,
  daily_target integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_id, target_month, target_year)
);

-- Update leads table with new fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sub_product_id uuid REFERENCES sub_products(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage lead_stage DEFAULT 'on_progress';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_type payment_type;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dp_amount numeric DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS final_price numeric DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Enable RLS on new tables
ALTER TABLE sub_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE handle_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_products
CREATE POLICY "Anyone can read active sub_products"
  ON sub_products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage sub_products"
  ON sub_products
  FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for leads (role-based access)
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON leads;

CREATE POLICY "Super admin can see all leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role = 'super_admin'
    )
  );

CREATE POLICY "Admin can see own leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    assigned_admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role = 'super_admin'
    )
  );

-- RLS Policies for handle_customers
CREATE POLICY "Super admin can see all handle_customers"
  ON handle_customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role = 'super_admin'
    )
  );

CREATE POLICY "HC can see assigned customers"
  ON handle_customers
  FOR ALL
  TO authenticated
  USING (
    assigned_hc_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role = 'super_admin'
    )
  );

-- RLS Policies for admin_targets
CREATE POLICY "Admins can see own targets"
  ON admin_targets
  FOR ALL
  TO authenticated
  USING (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role = 'super_admin'
    )
  );

-- RLS Policies for admins (role-based)
DROP POLICY IF EXISTS "Authenticated users can manage admins" ON admins;
DROP POLICY IF EXISTS "Authenticated users can read admins" ON admins;

CREATE POLICY "Super admin can manage all admins"
  ON admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role = 'super_admin'
    )
  );

CREATE POLICY "Users can read own admin data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Function to create handle customer when lead is completed
CREATE OR REPLACE FUNCTION create_handle_customer()
RETURNS TRIGGER AS $$
DECLARE
  hc_admin_id uuid;
  sub_product_name text;
BEGIN
  -- Only create handle customer when stage changes to 'closing' and follow_up_status is 'Selesai'
  IF NEW.stage = 'closing' AND NEW.follow_up_status = 'Selesai' AND 
     (OLD.stage != 'closing' OR OLD.follow_up_status != 'Selesai') THEN
    
    -- Get a random HC admin
    SELECT id INTO hc_admin_id
    FROM admins 
    WHERE role = 'handle_customer' AND is_active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Get sub product name
    SELECT sp.name INTO sub_product_name
    FROM sub_products sp
    WHERE sp.id = NEW.sub_product_id;
    
    -- Insert into handle_customers
    INSERT INTO handle_customers (
      lead_id,
      name,
      phone,
      source,
      sub_product_name,
      assigned_hc_id
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.phone,
      NEW.source,
      COALESCE(sub_product_name, 'Unknown Package'),
      hc_admin_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handle customer creation
DROP TRIGGER IF EXISTS create_handle_customer_trigger ON leads;
CREATE TRIGGER create_handle_customer_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_handle_customer();

-- Insert default sub-products for existing products
DO $$
DECLARE
  product_record RECORD;
  youneedmie_id uuid;
BEGIN
  -- Find Youneedmie product or create it
  SELECT id INTO youneedmie_id FROM products WHERE LOWER(name) LIKE '%youneedmie%' LIMIT 1;
  
  IF youneedmie_id IS NULL THEN
    INSERT INTO products (name, slug) VALUES ('Youneedmie', 'youneedmie') RETURNING id INTO youneedmie_id;
  END IF;
  
  -- Insert sub-products for Youneedmie
  INSERT INTO sub_products (product_id, name, price) VALUES
    (youneedmie_id, 'Paket Super Hemat', 150000),
    (youneedmie_id, 'Paket Hemat', 250000),
    (youneedmie_id, 'Paket Portable', 350000),
    (youneedmie_id, 'Paket Koper', 450000),
    (youneedmie_id, 'Paket Platinum', 650000),
    (youneedmie_id, 'Paket Kontainer', 850000)
  ON CONFLICT DO NOTHING;
END $$;

-- Insert default admin accounts
INSERT INTO admins (id, name, email, role, whatsapp_number, is_whatsapp_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin Berliana', 'berliana@admin.com', 'admin', '6285155145788', true),
  ('22222222-2222-2222-2222-222222222222', 'Admin Livia', 'livia@admin.com', 'admin', '6285117505788', true),
  ('33333333-3333-3333-3333-333333333333', 'Admin Reka', 'reka@admin.com', 'admin', '6282324159922', true),
  ('44444444-4444-4444-4444-444444444444', 'Handle Customer Selly', 'selly@hc.com', 'handle_customer', '628123456789', true),
  ('55555555-5555-5555-5555-555555555555', 'Super Admin Angger', 'angger@superadmin.com', 'super_admin', '628987654321', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  whatsapp_number = EXCLUDED.whatsapp_number,
  is_whatsapp_active = EXCLUDED.is_whatsapp_active;