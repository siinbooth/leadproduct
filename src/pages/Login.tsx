import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, DEMO_ACCOUNTS } from '../lib/supabase'
import { LogIn, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [isRegistering, setIsRegistering] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [creatingDemoAccounts, setCreatingDemoAccounts] = React.useState(false)
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    name: ''
  })

  React.useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard')
      }
    })
  }, [navigate])

  const createDemoAccounts = async () => {
    setCreatingDemoAccounts(true)
    
    try {
      // Create all demo accounts
      const allAccounts = [
        ...DEMO_ACCOUNTS.admins,
        DEMO_ACCOUNTS.handleCustomer,
        DEMO_ACCOUNTS.superAdmin
      ]

      for (const account of allAccounts) {
        try {
          // Try to sign up the user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: account.email,
            password: account.password
          })

          if (authError && !authError.message.includes('already registered')) {
            console.error(`Error creating ${account.email}:`, authError)
            continue
          }

          if (authData.user) {
            // Add to admins table
            const { error: adminError } = await supabase
              .from('admins')
              .upsert({
                id: authData.user.id,
                name: account.name,
                email: account.email,
                role: account.role,
                whatsapp_number: account.whatsapp_number || null,
                is_whatsapp_active: account.whatsapp_number ? true : false
              })

            if (adminError) {
              console.error(`Error adding ${account.email} to admins:`, adminError)
            }
          }
        } catch (error) {
          console.error(`Error processing ${account.email}:`, error)
        }
      }

      alert('Demo accounts berhasil dibuat! Silakan login dengan salah satu akun demo.')
    } catch (error) {
      console.error('Error creating demo accounts:', error)
      alert('Terjadi kesalahan saat membuat demo accounts')
    } finally {
      setCreatingDemoAccounts(false)
    }
  }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          alert('Email atau password salah. Pastikan akun sudah terdaftar atau buat demo accounts terlebih dahulu.')
        } else {
          alert('Login gagal: ' + error.message)
        }
        return
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      alert('Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) {
        alert('Registrasi gagal: ' + authError.message)
        return
      }

      if (authData.user) {
        // Add to admins table
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: 'admin'
          })

        if (adminError) {
          console.error('Error adding admin:', adminError)
          alert('User berhasil dibuat tapi gagal menambahkan ke admin table')
        } else {
          alert('Admin berhasil didaftarkan! Silakan login.')
          setIsRegistering(false)
          setFormData({ email: formData.email, password: '', name: '' })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Terjadi kesalahan saat registrasi')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (account: any) => {
    setFormData({
      email: account.email,
      password: account.password,
      name: account.name
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {isRegistering ? (
                <UserPlus className="w-8 h-8 text-blue-600" />
              ) : (
                <LogIn className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegistering ? 'Daftar Admin' : 'CRM Login'}
            </h1>
            <p className="text-gray-600">
              {isRegistering 
                ? 'Buat akun admin baru untuk mengelola leads'
                : 'Masuk ke dashboard untuk mengelola leads'
              }
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nama lengkap admin"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  {isRegistering ? 'Mendaftar...' : 'Masuk...'}
                </>
              ) : (
                isRegistering ? 'Daftar' : 'Masuk'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setFormData({ email: '', password: '', name: '' })
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isRegistering 
                ? 'Sudah punya akun? Login di sini'
                : 'Belum punya akun? Daftar di sini'
              }
            </button>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Demo Accounts</h2>
          <p className="text-gray-600 mb-6">Klik untuk mengisi form login dengan akun demo:</p>
          
          <div className="space-y-4">
            {/* Admin Accounts */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">👥 Admin Accounts</h3>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.admins.map((admin, index) => (
                  <button
                    key={index}
                    onClick={() => handleDemoLogin(admin)}
                    className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-blue-900">{admin.name}</div>
                    <div className="text-sm text-blue-600">{admin.email}</div>
                    <div className="text-xs text-blue-500">Password: {admin.password}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Handle Customer Account */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">🎧 Handle Customer</h3>
              <button
                onClick={() => handleDemoLogin(DEMO_ACCOUNTS.handleCustomer)}
                className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-green-900">{DEMO_ACCOUNTS.handleCustomer.name}</div>
                <div className="text-sm text-green-600">{DEMO_ACCOUNTS.handleCustomer.email}</div>
                <div className="text-xs text-green-500">Password: {DEMO_ACCOUNTS.handleCustomer.password}</div>
              </button>
            </div>

            {/* Super Admin Account */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">⚡ Super Admin</h3>
              <button
                onClick={() => handleDemoLogin(DEMO_ACCOUNTS.superAdmin)}
                className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-purple-900">{DEMO_ACCOUNTS.superAdmin.name}</div>
                <div className="text-sm text-purple-600">{DEMO_ACCOUNTS.superAdmin.email}</div>
                <div className="text-xs text-purple-500">Password: {DEMO_ACCOUNTS.superAdmin.password}</div>
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Ini adalah akun demo untuk testing. Di production, gunakan akun yang aman.
            </p>
            <button
              onClick={createDemoAccounts}
              disabled={creatingDemoAccounts}
              className="mt-3 w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {creatingDemoAccounts ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Membuat Demo Accounts...
                </>
              ) : (
                'Buat Semua Demo Accounts'
              )}
            </button>
            <p className="text-xs text-yellow-700 mt-2">
              Klik tombol ini jika demo accounts belum ada di sistem
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}