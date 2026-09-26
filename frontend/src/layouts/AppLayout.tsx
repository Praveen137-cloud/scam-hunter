import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Shield, LayoutDashboard, Search, History, FileText,
  User, Settings, LogOut, Menu, X, ChevronRight,
  AlertTriangle, Users, Bot, Sun, Moon, Scale
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyzer',  icon: Search,          label: 'Analyzer'  },
  { to: '/registry',  icon: Scale,           label: 'Registry'  },
  { to: '/history',   icon: History,         label: 'History'   },
  { to: '/simulator', icon: Bot,             label: 'Simulator' },
  { to: '/reports',   icon: FileText,        label: 'Reports'   },
  { to: '/profile',   icon: User,            label: 'Profile'   },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-dark-800 fixed h-full z-20">
        <SidebarContent user={user} navItems={navItems} onLogout={handleLogout} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-800 z-40 flex flex-col lg:hidden"
            >
              <SidebarContent user={user} navItems={navItems} onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-dark-900/80 backdrop-blur border-b border-dark-800 flex items-center px-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-dark-400 hover:text-cyber-400">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-400 hover:text-cyber-500 hover:bg-dark-800 transition-colors mr-1"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-dark-100">{user?.username}</p>
              <p className="text-xs text-dark-400">{user?.is_admin ? 'Administrator' : 'Analyst'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyber-500/20 border border-cyber-500/40 flex items-center justify-center text-cyber-400 font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ user, navItems, onLogout, onClose }: any) {
  return (
    <>
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyber-500/20 border border-cyber-500/40 flex items-center justify-center">
            <Shield size={16} className="text-cyber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark-100">Scam Hunter</p>
            <p className="text-xs text-cyber-500 font-mono">AI</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-dark-400 hover:text-dark-100 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }: any) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-cyber-500/15 text-cyber-400 border border-cyber-500/25'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
              }`
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}

        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mt-4 ${
                isActive
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                  : 'text-dark-400 hover:text-red-400 hover:bg-dark-800'
              }`
            }
          >
            <Users size={16} />
            <span className="flex-1">Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-dark-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-all"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </>
  )
}
