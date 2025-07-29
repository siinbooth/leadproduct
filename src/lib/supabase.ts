import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  name: string
  email: string
  is_active: boolean
  total_leads: number
  total_closings: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  product_id: string
  source: string
  assigned_admin_id: string
  follow_up_status: string
  lead_response: string
  dm_response: string
  package_taken: boolean
  revenue: number
  closing_date: string | null
  temperature: string
  created_at: string
  updated_at: string
  product?: Product
  assigned_admin?: Admin
}