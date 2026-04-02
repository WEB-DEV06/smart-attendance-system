import { useState, useEffect, createContext, useContext } from 'react'
import Dashboard from './components/Dashboard'
import RegisterStudent from './components/RegisterStudent'
import MarkAttendance from './components/MarkAttendance'
import ViewRecords from './components/ViewRecords'
import ManageStudents from './components/ManageStudents'
import { getStudents } from './api'
import './App.css'

export const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)

const DashIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
const RegIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
const MarkIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5-7-5-7 5"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
const RecIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const MgIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

const NAV = [
  { id: 'dashboard', label: 'Dashboard',        pip: 'Live', Icon: DashIcon },
  { id: 'register',  label: 'Register student',  pip: null,  Icon: RegIcon  },
  { id: 'mark',      label: 'Mark attendance',   pip: 'AI',  Icon: MarkIcon },
  { id: 'records',   label: 'View records',      pip: null,  Icon: RecIcon  },
  { id: 'manage',    label: 'Manage students',   pip: null,  Icon: MgIcon   },
]

const PAGE_META = {
  dashboard: ['Overview',         'attendiq / dashboard'],
  register:  ['Register student', 'attendiq / register'],
  mark:      ['Mark attendance',  'attendiq / recognition · AI'],
  records:   ['View records',     'attendiq / records'],
  manage:    ['Manage students',  'attendiq / students'],
}

export default function App() {
  const [tab,          setTab]          = useState('dashboard')
  const [theme,        setTheme]        = useState(() => localStorage.getItem('sas-theme') || 'dark')
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [studentCount, setStudentCount] = useState(null)

  const refreshStudentCount = async () => {
    try {
      const res = await getStudents({})
      setStudentCount(res.data.length)
    } catch { /* silently ignore */ }
  }

  useEffect(() => { refreshStudentCount() }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sas-theme', theme)
  }, [theme])

  const toggleTheme   = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const toggleSidebar = () => setSidebarOpen(o => !o)

  const [title, crumb] = PAGE_META[tab]
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app-shell">
        {theme === 'dark' && (
          <>
            <div className="bg-grid" />
            <div className="bg-orb1" />
            <div className="bg-orb2" />
          </>
        )}

        {/* TOP NAVBAR */}
        <header className="topnav">
          <button className="sb-toggle-btn" onClick={toggleSidebar}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2={sidebarOpen ? '15' : '21'} y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="nav-brand">
            <div className="nav-hex">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div className="nav-brand-name">AttendIQ</div>
              <div className="nav-brand-ver">v2.4.1 · beta</div>
            </div>
          </div>

          <div className="nav-divider" />

          <div className="nav-page-info">
            <div className="nav-title">{title}</div>
            <div className="nav-crumb">{crumb} · {today}</div>
          </div>

          <div className="nav-right">
            <div className="topchip topchip-live">
              <span className="live-dot" />System live
            </div>
            <div className="topchip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Chennai, TN
            </div>

            {/* Dark/Light toggle — top right */}
            <button className="dm-toggle" onClick={toggleTheme}>
              {theme === 'dark'
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              <div className="dm-track">
                <div className={`dm-thumb${theme === 'light' ? ' on' : ''}`} />
              </div>
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="body-row">
          <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-closed'}`}>
            <div className="sidebar-inner">
              <nav className="sidebar-nav">
                <div className="nav-section-label">Main menu</div>
                {NAV.map(n => {
                  const pip = n.id === 'manage'
                    ? (studentCount >= 1 ? String(studentCount) : null)
                    : n.pip
                  return (
                    <button key={n.id}
                      className={`nav-item${tab === n.id ? ' active' : ''}`}
                      onClick={() => { setTab(n.id); if (n.id === 'manage') refreshStudentCount() }}>
                      <span className="nav-item-dot" />
                      <n.Icon />
                      <span className="nav-item-label">{n.label}</span>
                      {pip && <span className="nav-item-pip">{pip}</span>}
                    </button>
                  )
                })}
              </nav>
              <div className="sidebar-footer">
                <div className="user-card">
                  <div className="user-av">AD</div>
                  <div>
                    <div className="user-name">Admin</div>
                    <div className="user-role">Super administrator</div>
                  </div>
                  <div className="user-online" />
                </div>
              </div>
            </div>
          </aside>

          <main className="main-content">
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'register'  && <RegisterStudent />}
            {tab === 'mark'      && <MarkAttendance />}
            {tab === 'records'   && <ViewRecords />}
            {tab === 'manage'    && <ManageStudents onCountChange={refreshStudentCount} />}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}
