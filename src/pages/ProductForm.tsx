import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Product, SubProduct, sendWhatsAppMessage } from '../lib/supabase'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function ProductForm() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = React.useState<Product | null>(null)
  const [subProducts, setSubProducts] = React.useState<SubProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    selectedSubProduct: '',
    source: ''
  })

  React.useEffect(() => {
    async function fetchProduct() {
      if (!slug) return
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        navigate('/404')
        return
      }
      
      setProduct(data)
      
      // Fetch sub-products
      const { data: subProductsData } = await supabase
        .from('sub_products')
        .select('*')
        .eq('product_id', data.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
      
      setSubProducts(subProductsData || [])
      setLoading(false)
    }
    
    fetchProduct()
  }, [slug, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || submitting || !formData.selectedSubProduct) return
    
    setSubmitting(true)
    
    try {
      const { data: leadData, error } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          phone: formData.phone,
          product_id: product.id,
          sub_product_id: formData.selectedSubProduct,
          source: formData.source
        })
        .select(`
          *,
          assigned_admin:admins(name, whatsapp_number, is_whatsapp_active),
          sub_product:sub_products(name, price)
        `)
        .single()
      
      if (error) throw error
      
      // Send WhatsApp notification to assigned admin
      if (leadData?.assigned_admin?.whatsapp_number && leadData.assigned_admin.is_whatsapp_active) {
        const message = `🔔 Lead Baru!\n\nNama: ${formData.name}\nHP: ${formData.phone}\nProduk: ${product.name}\nPaket: ${leadData.sub_product?.name}\nSumber: ${formData.source}\n\nSilakan follow up segera!`
        
        await sendWhatsAppMessage(leadData.assigned_admin.whatsapp_number, message)
      }
      
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Terima Kasih!
            </h1>
            <p className="text-gray-600 mb-6">
              Data Anda telah berhasil dikirim. Tim kami akan segera menghubungi Anda untuk informasi lebih lanjut mengenai <strong>{product?.name}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Paket yang dipilih: <strong>{subProducts.find(sp => sp.id === formData.selectedSubProduct)?.name}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Pastikan nomor HP Anda aktif agar kami dapat menghubungi Anda.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Daftar Sekarang
            </h1>
            <p className="text-gray-600">
              Dapatkan informasi lengkap tentang
            </p>
            <p className="text-blue-600 font-semibold text-lg">
              {product?.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor HP
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Paket
              </label>
              <select
                required
                value={formData.selectedSubProduct}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedSubProduct: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
              >
                <option value="">Pilih paket yang diinginkan</option>
                {subProducts.map((subProduct) => (
                  <option key={subProduct.id} value={subProduct.id}>
                    {subProduct.name} - Rp {subProduct.price.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari mana Anda mengetahui produk ini?
              </label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
              >
                <option value="">Pilih sumber informasi</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.selectedSubProduct}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Mengirim...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Data Anda aman dan hanya akan digunakan untuk keperluan komunikasi produk ini.
          </p>
        </div>
      </div>
    </div>
  )
}