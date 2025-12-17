import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { Confirmation } from '@/pages/auth/Confirmation'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { Transactions } from '@/pages/dashboard/Transactions'
import { Accounts } from '@/pages/dashboard/Accounts'
import { Cards } from '@/pages/dashboard/Cards'
import { Categories } from '@/pages/dashboard/Categories'
import { Goals } from '@/pages/dashboard/Goals'
import { Insights } from '@/pages/dashboard/Insights'
import { Reports } from '@/pages/dashboard/Reports'
import { Settings } from '@/pages/dashboard/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas - redireciona para dashboard se já estiver logado */}
        <Route
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirmation/signUp" element={<Confirmation />} />
        </Route>

        {/* Rotas protegidas - redireciona para login se não estiver autenticado */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirecionamento padrão */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
