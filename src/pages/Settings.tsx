import React from 'react'
import { supabase, Product, Admin } from '../lib/supabase'
import { Plus, Edit3, Trash2, Save, X, Users, Package } from 'lucide-react'

export default function Settings() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Product management state
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null)
  const [newProduct, setNewProduct] = React.useState({ name: '', slug: '' })
  const [addingProduct, setAddingProduct] = React.useState(false)
  
  // Admin management state
  const [editingAdmin, setEditingAdmin] = React.useState<string | null>(null)
  const [newAdmin, setNewAdmin] = React.useState({ name: '', email: '', password: '' })
  const [addingAdmin, setAddingAdmin] = React.useState(false)

  React.useEffect(() => {
    fetchProducts()
    fetchAdmins()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    setProducts(data || [])
    setLoading(false)
  }

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })
    
    setAdmins(data || [])
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '')
  }

  const addProduct = async () => {
    if (!newProduct.name.trim()) return

    const slug = newProduct.slug || generateSlug(newProduct.name)
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          slug: slug
        })

      if (error) throw error

      setNewProduct({ name: '', slug: '' })
      setAddingProduct(false)
      fetchProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Gagal menambah produk')
    }
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setEditingProduct(null)
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Gagal update produk')
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Gagal menghapus produk')
    }
  }

  const addAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !newAdmin.password.trim()) return

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password
      })

      if (authError) throw authError

      if (authData.user) {
        // Create admin record
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            id: authData.user.id,
            name: newAdmin.name,
            email: newAdmin.email
          })

        if (adminError) throw adminError
      }

      setNewAdmin({ name: '', email: '', password: '' })
      setAddingAdmin(false)
      fetchAdmins()
    } catch (error) {
      console.error('Error adding admin:', error)
      alert('Gagal menambah admin')
    }
  }

  const toggleAdminStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      fetchAdmins()
    } catch (error) {
      console.error('Error updating admin status:', error)
      alert('Gagal update status admin')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Kelola produk dan admin</p>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="mr-3 h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Kelola Produk</h2>
            </div>
            <button
              onClick={() => setAddingProduct(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Product Form */}
          {addingProduct && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Tambah Produk Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nama produk"
                  value={newProduct.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setNewProduct(prev => ({
                      ...prev,
                      name,
                      slug: generateSlug(name)
                    }))
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="URL slug (opsional)"
                  value={newProduct.slug}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, slug: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                URL akan menjadi: <strong>websaya.com/{newProduct.slug}</strong>
              </p>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={addProduct}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setAddingProduct(false)
                    setNewProduct({ name: '', slug: '' })
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {editingProduct === product.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mr-4">
                    <input
                      type="text"
                      defaultValue={product.name}
                      onChange={(e) => {
                        const name = e.target.value
                        product.name = name
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      defaultValue={product.slug}
                      onChange={(e) => {
                        product.slug = e.target.value
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">websaya.com/{product.slug}</p>
                    <p className="text-xs text-gray-400">
                      Status: {product.is_active ? (
                        <span className="text-green-600">Aktif</span>
                      ) : (
                        <span className="text-red-600">Nonaktif</span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {editingProduct === product.id ? (
                    <>
                      <button
                        onClick={() => updateProduct(product.id, { name: product.name, slug: product.slug })}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingProduct(product.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateProduct(product.id, { is_active: !product.is_active })}
                        className={`${product.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admins Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-3 h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Kelola Admin</h2>
            </div>
            <button
              onClick={() => setAddingAdmin(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Admin
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Admin Form */}
          {addingAdmin && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Tambah Admin Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nama admin"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email admin"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={addAdmin}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Tambah Admin
                </button>
                <button
                  onClick={() => {
                    setAddingAdmin(false)
                    setNewAdmin({ name: '', email: '', password: '' })
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Admins List */}
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{admin.name}</h3>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {admin.total_leads} leads • {admin.total_closings} closing
                    </span>
                    <span className="text-xs text-gray-500">
                      Rp {admin.total_revenue.toLocaleString('id-ID')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      admin.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    admin.is_active
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {admin.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}