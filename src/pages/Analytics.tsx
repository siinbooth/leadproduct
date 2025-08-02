import React from 'react'
import { supabase, Admin } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Package, DollarSign, Target, Calendar } from 'lucide-react'

export default function Analytics() {
  const [currentUser, setCurrentUser] = React.useState<Admin | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    totalLeads: 0,
    totalClosings: 0,
    totalRevenue: 0,
    conversionRate: 0
  })
  const [productStats, setProductStats] = React.useState<any[]>([])
  const [adminStats, setAdminStats] = React.useState<any[]>([])
  const [sourceStats, setSourceStats] = React.useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = React.useState<any[]>([])
  const [adminTargets, setAdminTargets] = React.useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())

  React.useEffect(() => {
    fetchAnalytics()
    fetchCurrentUser()
  }, [])

  React.useEffect(() => {
    fetchAnalytics()
  }, [selectedMonth, selectedYear])

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

  const fetchAnalytics = async () => {
    try {
      // Fetch leads with role-based filtering
      let leadsQuery = supabase
        .from('leads')
        .select(`
          *,
          product:products(*),
          sub_product:sub_products(*),
          assigned_admin:admins(*)
        `)
      
      const { data: leads } = await leadsQuery

      const totalLeads = leads?.length || 0
      const totalClosings = leads?.filter(lead => lead.stage === 'closing').length || 0
      const totalRevenue = leads?.reduce((sum, lead) => sum + (lead.final_price || 0), 0) || 0
      const conversionRate = totalLeads > 0 ? (totalClosings / totalLeads) * 100 : 0

      setStats({ totalLeads, totalClosings, totalRevenue, conversionRate })

      // Product performance
      const productMap = new Map()
      leads?.forEach(lead => {
        const productName = `${lead.product?.name || 'Unknown'} - ${lead.sub_product?.name || 'Unknown Package'}`
        if (!productMap.has(productName)) {
          productMap.set(productName, { name: productName, leads: 0, closings: 0, revenue: 0 })
        }
        const product = productMap.get(productName)
        product.leads += 1
        if (lead.stage === 'closing') {
          product.closings += 1
          product.revenue += lead.final_price || 0
        }
      })
      setProductStats(Array.from(productMap.values()))

      // Admin performance
      const { data: admins } = await supabase
        .from('admins')
        .select('*')
        .order('total_revenue', { ascending: false })

      setAdminStats(admins || [])

      // Source distribution
      const sourceMap = new Map()
      leads?.forEach(lead => {
        const source = lead.source
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
      })
      const sourceData = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }))
      setSourceStats(sourceData)

      // Monthly trend (last 6 months)
      const monthlyMap = new Map()
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = date.toISOString().slice(0, 7)
        const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
        monthlyMap.set(monthKey, { month: monthName, leads: 0, closings: 0, revenue: 0 })
      }

      leads?.forEach(lead => {
        const monthKey = lead.created_at.slice(0, 7)
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)
          monthData.leads += 1
          if (lead.stage === 'closing') {
            monthData.closings += 1
            monthData.revenue += lead.final_price || 0
          }
        }
      })

      setMonthlyTrend(Array.from(monthlyMap.values()))

      // Fetch admin targets for current month/year
      const { data: targetsData } = await supabase
        .from('admin_targets')
        .select(`
          *,
          admin:admins(*)
        `)
        .eq('target_month', selectedMonth)
        .eq('target_year', selectedYear)

      // Calculate actual performance vs targets
      const targetStats = targetsData?.map(target => {
        const adminLeads = leads?.filter(lead => 
          lead.assigned_admin_id === target.admin_id &&
          new Date(lead.created_at).getMonth() + 1 === selectedMonth &&
          new Date(lead.created_at).getFullYear() === selectedYear
        ) || []
        
        const actualClosings = adminLeads.filter(lead => lead.stage === 'closing').length
        const monthlyProgress = target.monthly_target > 0 ? (actualClosings / target.monthly_target) * 100 : 0
        
        return {
          ...target,
          actualClosings,
          monthlyProgress: Math.min(monthlyProgress, 100),
          totalLeads: adminLeads.length
        }
      }) || []

      setAdminTargets(targetStats)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Analisis performa leads dan tim</p>
          </div>
          
          {/* Month/Year Filter */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i
                return <option key={year} value={year}>{year}</option>
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
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

      {/* Admin Targets Performance - Only for Super Admin */}
      {currentUser?.role === 'super_admin' && adminTargets.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center mb-4">
            <Target className="mr-3 h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Target vs Actual - {new Date(0, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long' })} {selectedYear}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminTargets.map((target) => (
              <div key={target.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{target.admin?.name}</h4>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    target.monthlyProgress >= 100 
                      ? 'bg-green-100 text-green-800'
                      : target.monthlyProgress >= 75
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {target.monthlyProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium">{target.monthly_target} closing</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-medium">{target.actualClosings} closing</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Leads:</span>
                    <span className="font-medium">{target.totalLeads}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        target.monthlyProgress >= 100 
                          ? 'bg-green-500'
                          : target.monthlyProgress >= 75
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(target.monthlyProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Bulanan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
              <Bar dataKey="closings" fill="#10B981" name="Closings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sumber Leads</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Produk</h3>
          <div className="space-y-4">
            {productStats.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {product.leads} leads • {product.closings} closing
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Rp {product.revenue.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {product.leads > 0 ? ((product.closings / product.leads) * 100).toFixed(1) : 0}% conversion
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Performance */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Admin</h3>
          <div className="space-y-4">
            {adminStats.slice(0, 5).map((admin, index) => (
              <div key={admin.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
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
                  <p className="text-sm text-gray-600">
                    {admin.total_leads > 0 ? ((admin.total_closings / admin.total_leads) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}