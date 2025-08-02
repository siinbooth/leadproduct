import React from 'react'
import { supabase, HandleCustomer, Admin } from '../lib/supabase'
import { format } from 'date-fns'
import { Search, Filter, MessageCircle, Save, X, Phone } from 'lucide-react'

export default function HandleCustomers() {
  const [customers, setCustomers] = React.useState<HandleCustomer[]>([])
  const [filteredCustomers, setFilteredCustomers] = React.useState<HandleCustomer[]>([])
  const [currentUser, setCurrentUser] = React.useState<Admin | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterContacted, setFilterContacted] = React.useState('')
  const [editingCustomer, setEditingCustomer] = React.useState<string | null>(null)
  const [editData, setEditData] = React.useState<Partial<HandleCustomer>>({})

  React.useEffect(() => {
    fetchCustomers()
    fetchCurrentUser()
  }, [])

  React.useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, filterContacted])

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

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('handle_customers')
      .select(`
        *,
        assigned_hc:admins(*),
        lead:leads(*)
      `)
      .order('created_at', { ascending: false })

    setCustomers(data || [])
    setLoading(false)
  }

  const filterCustomers = () => {
    let filtered = customers

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.sub_product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterContacted) {
      const isContacted = filterContacted === 'contacted'
      filtered = filtered.filter(customer => customer.is_contacted === isContacted)
    }

    setFilteredCustomers(filtered)
  }

  const startEdit = (customer: HandleCustomer) => {
    setEditingCustomer(customer.id)
    setEditData(customer)
  }

  const cancelEdit = () => {
    setEditingCustomer(null)
    setEditData({})
  }

  const saveEdit = async () => {
    if (!editingCustomer || !editData) return

    try {
      const updateData: any = {
        is_contacted: editData.is_contacted,
        notes: editData.notes,
        updated_at: new Date().toISOString()
      }

      if (editData.is_contacted && !editData.contacted_at) {
        updateData.contacted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('handle_customers')
        .update(updateData)
        .eq('id', editingCustomer)

      if (error) throw error

      await fetchCustomers()
      setEditingCustomer(null)
      setEditData({})
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Gagal update customer')
    }
  }

  const markAsContacted = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('handle_customers')
        .update({
          is_contacted: true,
          contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)

      if (error) throw error

      await fetchCustomers()
    } catch (error) {
      console.error('Error marking as contacted:', error)
      alert('Gagal update status kontak')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check if user has access
  if (currentUser && !['handle_customer', 'super_admin'].includes(currentUser.role)) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Handle Customers</h1>
        <p className="text-gray-600">Kelola customer yang sudah closing</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari nama, HP, atau paket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterContacted}
            onChange={(e) => setFilterContacted(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="contacted">Sudah Dihubungi</option>
            <option value="not_contacted">Belum Dihubungi</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="mr-2 h-4 w-4" />
            {filteredCustomers.length} dari {customers.length} customers
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paket & Sumber
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Kontak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                      <div className="text-xs text-gray-400">
                        Closing: {format(new Date(customer.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.sub_product_name}</div>
                      <div className="text-sm text-gray-500">Sumber: {customer.source}</div>
                      <div className="text-xs text-gray-400">
                        HC: {customer.assigned_hc?.name || 'Belum assigned'}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {editingCustomer === customer.id ? (
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editData.is_contacted || false}
                            onChange={(e) => setEditData(prev => ({ ...prev, is_contacted: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">Sudah Dihubungi</span>
                        </label>
                      </div>
                    ) : (
                      <div>
                        {customer.is_contacted ? (
                          <div>
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sudah Dihubungi
                            </span>
                            {customer.contacted_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                {format(new Date(customer.contacted_at), 'dd/MM/yyyy HH:mm')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Belum Dihubungi
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {editingCustomer === customer.id ? (
                      <textarea
                        value={editData.notes || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Catatan..."
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        rows={3}
                      />
                    ) : (
                      <div className="text-xs text-gray-600 max-w-xs">
                        {customer.notes || '-'}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {editingCustomer === customer.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(customer)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        {!customer.is_contacted && (
                          <button
                            onClick={() => markAsContacted(customer.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as Contacted"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada customers yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}