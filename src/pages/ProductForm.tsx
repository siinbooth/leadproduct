import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Product } from '../lib/supabase'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function ProductForm() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = React.useState<Product | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
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
      setLoading(false)
    }
    
    fetchProduct()
  }, [slug, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || submitting) return
    
    setSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          phone: formData.phone,
          product_id: product.id,
          source: formData.source
        })
      
      if (error) throw error
      
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
              disabled={submitting}
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