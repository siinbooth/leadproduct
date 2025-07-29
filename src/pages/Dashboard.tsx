import React from 'react'
import { supabase, Lead, Admin } from '../lib/supabase'
import { Users, TrendingUp, DollarSign, Package } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    totalLeads: 0,
    totalClosings: 0,
    totalRevenue: 0,
    conversionRate: 0
  })
  const [recentLeads, setRecentLeads] = React.useState<Lead[]>([])
  const [topAdmins, setTopAdmins] = React.useState<Admin[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch overall stats
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
      
      const totalLeads = leads?.length || 0
      const totalClosings = leads?.filter(lead => lead.package_taken).length || 0
      const totalRevenue = leads?.reduce((sum, lead) => sum + (lead.revenue || 0), 0) || 0
      const conversionRate = totalLeads > 0 ? (totalClosings / totalLeads) * 100 : 0

      setStats({
        totalLeads,
        totalClosings,
        totalRevenue,
        conversionRate
      })

      // Fetch recent leads
      const { data: recentLeadsData } = await supabase
        .from('leads')
        .select(`
          *,
          product:products(*),
          assigned_admin:admins(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentLeads(recentLeadsData || [])

      // Fetch top admins
      const { data: adminsData } = await supabase
        .from('admins')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(5)

      setTopAdmins(adminsData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview leads dan performa tim</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Closing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClosings}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Leads Terbaru</h2>
          </div>
          <div className="p-6">
            {recentLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada leads</p>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-600">{lead.product?.name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        lead.temperature === 'Hot' 
                          ? 'bg-red-100 text-red-800'
                          : lead.temperature === 'Warm'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.temperature}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Admins */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
          </div>
          <div className="p-6">
            {topAdmins.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada data admin</p>
            ) : (
              <div className="space-y-4">
                {topAdmins.map((admin, index) => (
                  <div key={admin.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-600">
                          {admin.total_leads} leads • {admin.total_closings} closing
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rp {admin.total_revenue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}