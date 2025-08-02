import React from 'react'
import { supabase, Product, Admin, SubProduct, AdminTarget, UserRole } from '../lib/supabase'
import { Plus, Edit3, Trash2, Save, X, Users, Package, Target, MessageSquare } from 'lucide-react'

export default function Settings() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [subProducts, setSubProducts] = React.useState<SubProduct[]>([])
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [targets, setTargets] = React.useState<AdminTarget[]>([])
  const [currentUser, setCurrentUser] = React.useState<Admin | null>(null)
  const [loading, setLoading] = React.useState(true)
  
  // Product management state
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null)
  const [newProduct, setNewProduct] = React.useState({ name: '', slug: '' })
  const [addingProduct, setAddingProduct] = React.useState(false)
  
  // Sub-product management state
  const [editingSubProduct, setEditingSubProduct] = React.useState<string | null>(null)
  const [newSubProduct, setNewSubProduct] = React.useState({ product_id: '', name: '', price: 0 })
  const [addingSubProduct, setAddingSubProduct] = React.useState(false)
  
  // Admin management state
  const [editingAdmin, setEditingAdmin] = React.useState<string | null>(null)
  const [newAdmin, setNewAdmin] = React.useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'admin' as UserRole,
    whatsapp_number: ''
  })
  const [addingAdmin, setAddingAdmin] = React.useState(false)
  
  // Target management state
  const [editingTarget, setEditingTarget] = React.useState<string | null>(null)
  const [newTarget, setNewTarget] = React.useState({ 
    admin_id: '', 
    target_month: new Date().getMonth() + 1,
    target_year: new Date().getFullYear(),
    monthly_target: 0,
    daily_target: 0
  })
  const [addingTarget, setAddingTarget] = React.useState(false)

  React.useEffect(() => {
    fetchProducts()
    fetchSubProducts()
    fetchAdmins()
    fetchTargets()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser(data)
    }
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    setProducts(data || [])
    setLoading(false)
  }

  const fetchSubProducts = async () => {
    const { data } = await supabase
      .from('sub_products')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false })
    
    setSubProducts(data || [])
  }

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })
    
    setAdmins(data || [])
  }

  const fetchTargets = async () => {
    const { data } = await supabase
      .from('admin_targets')
      .select('*, admin:admins(*)')
      .order('created_at', { ascending: false })
    
    setTargets(data || [])
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

  const addSubProduct = async () => {
    if (!newSubProduct.name.trim() || !newSubProduct.product_id) return

    try {
      const { error } = await supabase
        .from('sub_products')
        .insert({
          product_id: newSubProduct.product_id,
          name: newSubProduct.name,
          price: newSubProduct.price
        })

      if (error) throw error

      setNewSubProduct({ product_id: '', name: '', price: 0 })
      setAddingSubProduct(false)
      fetchSubProducts()
    } catch (error) {
      console.error('Error adding sub-product:', error)
      alert('Gagal menambah sub-produk')
    }
  }

  const updateSubProduct = async (id: string, data: Partial<SubProduct>) => {
    try {
      const { error } = await supabase
        .from('sub_products')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setEditingSubProduct(null)
      fetchSubProducts()
    } catch (error) {
      console.error('Error updating sub-product:', error)
      alert('Gagal update sub-produk')
    }
  }

  const deleteSubProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus sub-produk ini?')) return

    try {
      const { error } = await supabase
        .from('sub_products')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchSubProducts()
    } catch (error) {
      console.error('Error deleting sub-product:', error)
      alert('Gagal menghapus sub-produk')
    }
  }

  const addAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !newAdmin.password.trim() || !newAdmin.whatsapp_number.trim()) return

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
            email: newAdmin.email,
            role: newAdmin.role,
            whatsapp_number: newAdmin.whatsapp_number
          })

        if (adminError) throw adminError
      }

      setNewAdmin({ name: '', email: '', password: '', role: 'admin', whatsapp_number: '' })
      setAddingAdmin(false)
      fetchAdmins()
    } catch (error) {
      console.error('Error adding admin:', error)
      alert('Gagal menambah admin')
    }
  }

  const updateAdmin = async (id: string, data: Partial<Admin>) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setEditingAdmin(null)
      fetchAdmins()
    } catch (error) {
      console.error('Error updating admin:', error)
      alert('Gagal update admin')
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

  const addTarget = async () => {
    if (!newTarget.admin_id) return

    try {
      const { error } = await supabase
        .from('admin_targets')
        .insert(newTarget)

      if (error) throw error

      setNewTarget({ 
        admin_id: '', 
        target_month: new Date().getMonth() + 1,
        target_year: new Date().getFullYear(),
        monthly_target: 0,
        daily_target: 0
      })
      setAddingTarget(false)
      fetchTargets()
    } catch (error) {
      console.error('Error adding target:', error)
      alert('Gagal menambah target')
    }
  }

  const updateTarget = async (id: string, data: Partial<AdminTarget>) => {
    try {
      const { error } = await supabase
        .from('admin_targets')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setEditingTarget(null)
      fetchTargets()
    } catch (error) {
      console.error('Error updating target:', error)
      alert('Gagal update target')
    }
  }

  // Only super admin can access settings
  if (currentUser && currentUser.role !== 'super_admin') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
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
                URL akan menjadi: <strong>lead.paketusaha.web.id/{newProduct.slug}</strong>
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
                    <p className="text-sm text-gray-600">lead.paketusaha.web.id/{product.slug}</p>
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

      {/* Sub-Products Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="mr-3 h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Kelola Sub-Produk</h2>
            </div>
            <button
              onClick={() => setAddingSubProduct(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sub-Produk
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Sub-Product Form */}
          {addingSubProduct && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Tambah Sub-Produk Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={newSubProduct.product_id}
                  onChange={(e) => setNewSubProduct(prev => ({ ...prev, product_id: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih Produk</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Nama sub-produk"
                  value={newSubProduct.name}
                  onChange={(e) => setNewSubProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Harga"
                  value={newSubProduct.price}
                  onChange={(e) => setNewSubProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={addSubProduct}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setAddingSubProduct(false)
                    setNewSubProduct({ product_id: '', name: '', price: 0 })
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Sub-Products List */}
          <div className="space-y-4">
            {subProducts.map((subProduct) => (
              <div key={subProduct.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {editingSubProduct === subProduct.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mr-4">
                    <input
                      type="text"
                      defaultValue={subProduct.name}
                      onChange={(e) => {
                        subProduct.name = e.target.value
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      defaultValue={subProduct.price}
                      onChange={(e) => {
                        subProduct.price = parseFloat(e.target.value) || 0
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{subProduct.name}</h3>
                    <p className="text-sm text-gray-600">
                      {subProduct.product?.name} - Rp {subProduct.price.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Status: {subProduct.is_active ? (
                        <span className="text-green-600">Aktif</span>
                      ) : (
                        <span className="text-red-600">Nonaktif</span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {editingSubProduct === subProduct.id ? (
                    <>
                      <button
                        onClick={() => updateSubProduct(subProduct.id, { 
                          name: subProduct.name, 
                          price: subProduct.price 
                        })}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingSubProduct(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingSubProduct(subProduct.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateSubProduct(subProduct.id, { is_active: !subProduct.is_active })}
                        className={`${subProduct.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {subProduct.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => deleteSubProduct(subProduct.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="handle_customer">Handle Customer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="Nomor WhatsApp"
                  value={newAdmin.whatsapp_number}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, whatsapp_number: e.target.value }))}
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
                    setNewAdmin({ name: '', email: '', password: '', role: 'admin', whatsapp_number: '' })
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
                  <p className="text-sm text-gray-600">
                    Role: <span className="capitalize">{admin.role.replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <MessageSquare className="inline h-3 w-3 mr-1" />
                    {admin.whatsapp_number} 
                    {admin.is_whatsapp_active ? (
                      <span className="text-green-600 ml-1">✓</span>
                    ) : (
                      <span className="text-red-600 ml-1">✗</span>
                    )}
                  </p>
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

                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      admin.is_active
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {admin.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => updateAdmin(admin.id, { is_whatsapp_active: !admin.is_whatsapp_active })}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      admin.is_whatsapp_active
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    WA {admin.is_whatsapp_active ? 'Off' : 'On'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Targets Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="mr-3 h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Kelola Target Admin</h2>
            </div>
            <button
              onClick={() => setAddingTarget(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Target
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Target Form */}
          {addingTarget && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Tambah Target Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={newTarget.admin_id}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, admin_id: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih Admin</option>
                  {admins.filter(admin => admin.role === 'admin').map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                  ))}
                </select>
                <select
                  value={newTarget.target_month}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, target_month: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Tahun"
                  value={newTarget.target_year}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, target_year: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Target Bulanan"
                  value={newTarget.monthly_target}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, monthly_target: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Target Harian"
                  value={newTarget.daily_target}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, daily_target: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={addTarget}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setAddingTarget(false)
                    setNewTarget({ 
                      admin_id: '', 
                      target_month: new Date().getMonth() + 1,
                      target_year: new Date().getFullYear(),
                      monthly_target: 0,
                      daily_target: 0
                    })
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Targets List */}
          <div className="space-y-4">
            {targets.map((target) => (
              <div key={target.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{target.admin?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(0, target.target_month - 1).toLocaleDateString('id-ID', { month: 'long' })} {target.target_year}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      Bulanan: {target.monthly_target} closing
                    </span>
                    <span className="text-xs text-gray-500">
                      Harian: {target.daily_target} closing
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingTarget(target.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}