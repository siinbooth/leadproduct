import React from 'react'
import { supabase, Lead, Admin } from '../lib/supabase'
import { format } from 'date-fns'
import { Search, Filter, Edit3, Save, X } from 'lucide-react'

export default function Leads() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = React.useState<Lead[]>([])
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState('')
  const [filterTemperature, setFilterTemperature] = React.useState('')
  const [editingLead, setEditingLead] = React.useState<string | null>(null)
  const [editData, setEditData] = React.useState<Partial<Lead>>({})

  React.useEffect(() => {
    fetchLeads()
    fetchAdmins()
  }, [])

  React.useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, filterStatus, filterTemperature])

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select(`
        *,
        product:products(*),
        assigned_admin:admins(*)
      `)
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setLoading(false)
  }

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('is_active', true)

    setAdmins(data || [])
  }

  const filterLeads = () => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(lead => lead.follow_up_status === filterStatus)
    }

    if (filterTemperature) {
      filtered = filtered.filter(lead => lead.temperature === filterTemperature)
    }

    setFilteredLeads(filtered)
  }

  const startEdit = (lead: Lead) => {
    setEditingLead(lead.id)
    setEditData(lead)
  }

  const cancelEdit = () => {
    setEditingLead(null)
    setEditData({})
  }

  const saveEdit = async () => {
    if (!editingLead || !editData) return

    try {
      const updateData: any = {
        follow_up_status: editData.follow_up_status,
        lead_response: editData.lead_response,
        dm_response: editData.dm_response,
        package_taken: editData.package_taken,
        revenue: editData.revenue || 0,
        temperature: editData.temperature,
        updated_at: new Date().toISOString()
      }

      if (editData.package_taken && !editData.closing_date) {
        updateData.closing_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', editingLead)

      if (error) throw error

      await fetchLeads()
      setEditingLead(null)
      setEditData({})
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Gagal update lead')
    }
  }

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'Hot': return 'bg-red-100 text-red-800'
      case 'Warm': return 'bg-yellow-100 text-yellow-800'
      case 'Cold': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sudah Difollow': return 'bg-green-100 text-green-800'
      case 'Dalam Proses': return 'bg-yellow-100 text-yellow-800'
      case 'Belum Difollow': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Leads</h1>
        <p className="text-gray-600">Kelola dan follow up semua leads</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari nama, HP, atau produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="Belum Difollow">Belum Difollow</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Sudah Difollow">Sudah Difollow</option>
          </select>

          <select
            value={filterTemperature}
            onChange={(e) => setFilterTemperature(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Temperature</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="mr-2 h-4 w-4" />
            {filteredLeads.length} dari {leads.length} leads
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk & Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Temperature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Follow Up
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.product?.name}</div>
                      <div className="text-sm text-gray-500">
                        Admin: {lead.assigned_admin?.name || 'Belum assigned'}
                      </div>
                      <div className="text-xs text-gray-400">Sumber: {lead.source}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {editingLead === lead.id ? (
                      <div className="space-y-2">
                        <select
                          value={editData.follow_up_status}
                          onChange={(e) => setEditData(prev => ({ ...prev, follow_up_status: e.target.value }))}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="Belum Difollow">Belum Difollow</option>
                          <option value="Dalam Proses">Dalam Proses</option>
                          <option value="Sudah Difollow">Sudah Difollow</option>
                        </select>
                        <select
                          value={editData.temperature}
                          onChange={(e) => setEditData(prev => ({ ...prev, temperature: e.target.value }))}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="Hot">Hot</option>
                          <option value="Warm">Warm</option>
                          <option value="Cold">Cold</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.follow_up_status)}`}>
                          {lead.follow_up_status}
                        </span>
                        <br />
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTemperatureColor(lead.temperature)}`}>
                          {lead.temperature}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {editingLead === lead.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editData.lead_response || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, lead_response: e.target.value }))}
                          placeholder="Respon leads..."
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          rows={2}
                        />
                        <textarea
                          value={editData.dm_response || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, dm_response: e.target.value }))}
                          placeholder="Respon DM..."
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          <strong>Leads:</strong> {lead.lead_response || '-'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <strong>DM:</strong> {lead.dm_response || '-'}
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {editingLead === lead.id ? (
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editData.package_taken || false}
                            onChange={(e) => setEditData(prev => ({ ...prev, package_taken: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">Ambil Paket</span>
                        </label>
                        <input
                          type="number"
                          value={editData.revenue || 0}
                          onChange={(e) => setEditData(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                          placeholder="Revenue"
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium">
                          {lead.package_taken ? (
                            <span className="text-green-600">✓ Ambil Paket</span>
                          ) : (
                            <span className="text-gray-400">Belum Ambil</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Rp {(lead.revenue || 0).toLocaleString('id-ID')}
                        </div>
                        {lead.closing_date && (
                          <div className="text-xs text-gray-400">
                            Closing: {format(new Date(lead.closing_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {editingLead === lead.id ? (
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
                      <button
                        onClick={() => startEdit(lead)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada leads yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}