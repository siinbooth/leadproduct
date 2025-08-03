import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type UserRole = 'admin' | 'handle_customer' | 'super_admin'
export type LeadStage = 'on_progress' | 'loss' | 'closing'
export type PaymentType = 'full_transfer' | 'cod' | 'dp'

export interface Product {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SubProduct {
  id: string
  product_id: string
  name: string
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
  product?: Product
}

export interface Admin {
  id: string
  name: string
  email: string
  role: UserRole
  whatsapp_number?: string
  is_whatsapp_active: boolean
  is_active: boolean
  total_leads: number
  total_closings: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface HandleCustomer {
  id: string
  lead_id: string
  name: string
  phone: string
  source: string
  sub_product_name: string
  assigned_hc_id?: string
  is_contacted: boolean
  contacted_at?: string
  notes: string
  created_at: string
  updated_at: string
  assigned_hc?: Admin
  lead?: Lead
}

export interface AdminTarget {
  id: string
  admin_id: string
  target_month: number
  target_year: number
  monthly_target: number
  daily_target: number
  created_at: string
  updated_at: string
  admin?: Admin
}

export interface Lead {
  id: string
  name: string
  phone: string
  product_id: string
  sub_product_id?: string
  source: string
  assigned_admin_id: string
  follow_up_status: string
  lead_response: string
  dm_response: string
  package_taken: boolean
  revenue: number
  final_price: number
  closing_date: string | null
  temperature: string
  stage: LeadStage
  payment_type?: PaymentType
  dp_amount: number
  notes: string
  created_at: string
  updated_at: string
  product?: Product
  sub_product?: SubProduct
  assigned_admin?: Admin
}

// WhatsApp integration
export const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  // This would integrate with WhatsApp Business API
  // For now, we'll just log the message
  console.log(`Sending WhatsApp to ${phoneNumber}: ${message}`)
  
  // In production, you would call WhatsApp Business API here
  // Example: await fetch('https://api.whatsapp.com/send', { ... })
  
  return { success: true }
}

// Pre-configured accounts with credentials
export const DEMO_ACCOUNTS = {
  admins: [
    { email: 'berliana@admin.com', password: 'berliana123', name: 'Admin Berliana', role: 'admin' },
    { email: 'livia@admin.com', password: 'livia123', name: 'Admin Livia', role: 'admin' },
    { email: 'reka@admin.com', password: 'reka123', name: 'Admin Reka', role: 'admin' }
  ],
  handleCustomer: {
    email: 'selly@hc.com', 
    password: 'selly123', 
    name: 'Handle Customer Selly', 
    role: 'handle_customer'
  },
  superAdmin: {
    email: 'angger@superadmin.com', 
    password: 'angger123', 
    name: 'Super Admin Angger', 
    role: 'super_admin'
  }
}