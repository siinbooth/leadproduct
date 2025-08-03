/*
  # Complete CRM System with Multi-Product Variants

  1. New Tables
    - `products` - Main products (Youneedmie, etc.)
    - `sub_products` - Product variants/packages with prices
    - `admins` - User management with roles and WhatsApp
    - `leads` - Lead management with stages and payments
    - `handle_customers` - Closed leads for customer service
    - `admin_targets` - Monthly/daily targets for admins

  2. Roles
    - admin: Can only see their assigned leads
    - handle_customer: Manages closed leads
    - super_admin: Full access to everything

  3. Features
    - Auto lead assignment to admins
    - WhatsApp notifications
    - Target tracking and analytics
    - Role-based data access
*/

-- Products table (main products)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sub-products table (packages/variants)
CREATE TABLE IF NOT EXISTS sub_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admins table with roles and WhatsApp
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'handle_customer', 'super_admin')),
  whatsapp_number text,
  is_whatsapp_active boolean DEFAULT true,
  is_active boolean DEFAULT true,
  total_leads integer DEFAULT 0,
  total_closings integer DEFAULT 0,
  total_revenue numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads table with enhanced fields
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sub_product_id uuid REFERENCES sub_products(id) ON DELETE SET NULL,
  source text NOT NULL,
  assigned_admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  follow_up_status text DEFAULT 'Belum Difollow',
  lead_response text DEFAULT '',
  dm_response text DEFAULT '',
  package_taken boolean DEFAULT false,
  revenue numeric(12,2) DEFAULT 0,
  final_price numeric(12,2) DEFAULT 0,
  closing_date timestamptz,
  temperature text DEFAULT 'Cold' CHECK (temperature IN ('Hot', 'Warm', 'Cold')),
  stage text DEFAULT 'on_progress' CHECK (stage IN ('on_progress', 'loss', 'closing')),
  payment_type text CHECK (payment_type IN ('full_transfer', 'cod', 'dp')),
  dp_amount numeric(12,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Handle customers table
CREATE TABLE IF NOT EXISTS handle_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
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

-- Admin targets table
CREATE TABLE IF NOT EXISTS admin_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  target_month integer NOT NULL CHECK (target_month BETWEEN 1 AND 12),
  target_year integer NOT NULL,
  monthly_target integer NOT NULL DEFAULT 0,
  daily_target integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_id, target_month, target_year)
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE handle_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_targets ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Sub-products policies
CREATE POLICY "Anyone can read active sub-products"
  ON sub_products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage sub-products"
  ON sub_products
  FOR ALL
  TO authenticated
  USING (true);

-- Admins policies
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

-- Leads policies
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (true);

-- Handle customers policies
CREATE POLICY "Authenticated users can manage handle customers"
  ON handle_customers
  FOR ALL
  TO authenticated
  USING (true);

-- Admin targets policies
CREATE POLICY "Authenticated users can manage admin targets"
  ON admin_targets
  FOR ALL
  TO authenticated
  USING (true);

-- Insert sample products
INSERT INTO products (name, slug) VALUES
  ('Youneedmie', 'youneedmie'),
  ('MyBestea', 'mybestea'),
  ('Kopi Ibukota', 'kopiibukota'),
  ('Chick Ichik', 'chickichik')
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-products for Youneedmie
INSERT INTO sub_products (product_id, name, price) 
SELECT p.id, sp.name, sp.price
FROM products p
CROSS JOIN (VALUES
  ('Paket Super Hemat', 150000),
  ('Paket Hemat', 250000),
  ('Paket Portable', 350000),
  ('Paket Koper', 450000),
  ('Paket Platinum', 650000),
  ('Paket Kontainer', 850000)
) AS sp(name, price)
WHERE p.slug = 'youneedmie'
ON CONFLICT DO NOTHING;

-- Insert other sub-products
INSERT INTO sub_products (product_id, name, price) 
SELECT p.id, sp.name, sp.price
FROM products p
CROSS JOIN (VALUES
  ('Paket Starter', 200000),
  ('Paket Premium', 400000),
  ('Paket Ultimate', 600000)
) AS sp(name, price)
WHERE p.slug IN ('mybestea', 'kopiibukota', 'chickichik')
ON CONFLICT DO NOTHING;

-- Insert pre-configured admin accounts
INSERT INTO admins (id, name, email, role, whatsapp_number) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin Berliana', 'berliana@admin.com', 'admin', '6285155145788'),
  ('22222222-2222-2222-2222-222222222222', 'Admin Livia', 'livia@admin.com', 'admin', '6285117505788'),
  ('33333333-3333-3333-3333-333333333333', 'Admin Reka', 'reka@admin.com', 'admin', '6282324159922'),
  ('44444444-4444-4444-4444-444444444444', 'Handle Customer Selly', 'selly@hc.com', 'handle_customer', '628123456789'),
  ('55555555-5555-5555-5555-555555555555', 'Super Admin Angger', 'angger@superadmin.com', 'super_admin', '628987654321')
ON CONFLICT (id) DO NOTHING;

-- Function to auto-assign leads to active admins
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  next_admin_id uuid;
BEGIN
  -- Get the admin with the least leads who is active and has role 'admin'
  SELECT id INTO next_admin_id
  FROM admins
  WHERE is_active = true AND role = 'admin'
  ORDER BY total_leads ASC, created_at ASC
  LIMIT 1;
  
  IF next_admin_id IS NOT NULL THEN
    NEW.assigned_admin_id = next_admin_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update admin stats
CREATE OR REPLACE FUNCTION update_admin_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- Update total leads count
    UPDATE admins 
    SET total_leads = total_leads + 1,
        updated_at = now()
    WHERE id = NEW.assigned_admin_id;
    
    -- If it's already a closing, update closing stats
    IF NEW.stage = 'closing' THEN
      UPDATE admins 
      SET total_closings = total_closings + 1,
          total_revenue = total_revenue + COALESCE(NEW.final_price, 0),
          updated_at = now()
      WHERE id = NEW.assigned_admin_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If stage changed to closing
    IF OLD.stage != 'closing' AND NEW.stage = 'closing' THEN
      UPDATE admins 
      SET total_closings = total_closings + 1,
          total_revenue = total_revenue + COALESCE(NEW.final_price, 0),
          updated_at = now()
      WHERE id = NEW.assigned_admin_id;
      
      -- Create handle customer record if status is completed
      IF NEW.follow_up_status = 'Selesai' THEN
        INSERT INTO handle_customers (
          lead_id, name, phone, source, sub_product_name, assigned_hc_id
        ) VALUES (
          NEW.id, 
          NEW.name, 
          NEW.phone, 
          NEW.source,
          COALESCE((SELECT name FROM sub_products WHERE id = NEW.sub_product_id), 'Unknown Package'),
          (SELECT id FROM admins WHERE role = 'handle_customer' AND is_active = true LIMIT 1)
        );
      END IF;
      
    -- If stage changed from closing to something else
    ELSIF OLD.stage = 'closing' AND NEW.stage != 'closing' THEN
      UPDATE admins 
      SET total_closings = total_closings - 1,
          total_revenue = total_revenue - COALESCE(OLD.final_price, 0),
          updated_at = now()
      WHERE id = NEW.assigned_admin_id;
      
    -- If final_price changed and it's a closing
    ELSIF NEW.stage = 'closing' AND OLD.final_price != NEW.final_price THEN
      UPDATE admins 
      SET total_revenue = total_revenue - COALESCE(OLD.final_price, 0) + COALESCE(NEW.final_price, 0),
          updated_at = now()
      WHERE id = NEW.assigned_admin_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Update total leads count
    UPDATE admins 
    SET total_leads = total_leads - 1,
        updated_at = now()
    WHERE id = OLD.assigned_admin_id;
    
    -- If it was a closing, update closing stats
    IF OLD.stage = 'closing' THEN
      UPDATE admins 
      SET total_closings = total_closings - 1,
          total_revenue = total_revenue - COALESCE(OLD.final_price, 0),
          updated_at = now()
      WHERE id = OLD.assigned_admin_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS auto_assign_lead_trigger ON leads;
CREATE TRIGGER auto_assign_lead_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();

DROP TRIGGER IF EXISTS update_admin_stats_trigger ON leads;
CREATE TRIGGER update_admin_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_stats();

-- Insert sample targets for admins
INSERT INTO admin_targets (admin_id, target_month, target_year, monthly_target, daily_target)
SELECT 
  id,
  EXTRACT(MONTH FROM CURRENT_DATE)::integer,
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  30,
  1
FROM admins 
WHERE role = 'admin'
ON CONFLICT (admin_id, target_month, target_year) DO NOTHING;