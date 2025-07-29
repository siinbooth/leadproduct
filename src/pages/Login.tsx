import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogIn, Loader2, UserPlus } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [isRegistering, setIsRegistering] = React.useState(false)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        alert('Login gagal: ' + error.message)
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
            email: formData.email
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
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
              {isRegistering ? 'Daftar Admin' : 'Admin Login'}
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
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
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
                : 
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}