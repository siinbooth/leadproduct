import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ProductForm from './pages/ProductForm'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import HandleCustomers from './pages/HandleCustomers'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public product form routes */}
        <Route path="/:slug" element={<ProductForm />} />
        
        {/* Auth route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected admin routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="handle-customers" element={<HandleCustomers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}