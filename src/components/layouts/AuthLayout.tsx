import { Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-display font-bold text-primary-800 mb-2">Pulso</h1>
          <p className="text-body text-neutral-500">Gerencie suas finanças pessoais</p>
        </div>
        <div className="bg-white rounded-card-lg p-8 shadow-card border border-border">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

