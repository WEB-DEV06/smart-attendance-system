import { useEffect, useState } from 'react'
import { getSummary, getAttendance } from '../api'

const StatIcon = ({ color, bg, children }) => (
  <div className="stat-icon" style={{ background: bg }}>
    <svg
      width="17" height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  </div>
)

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalStudents: 0, presentToday: 0, absentToday: 0,
    attendanceRate: 0, weekly: [], deptBreakdown: []
  })
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([getSummary(), getAttendance({ limit: 5 })])
        setSummary(s.data)
        setRecent(r.data.slice(0, 5))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [])

  const stats = [
    {
      label: 'Total students',
      value: summary.totalStudents,
      sub: 'Registered',
      color: 'var(--indigo)',
      bg: 'rgba(99,102,241,0.12)',
      accent: 'var(--indigo)',
      icon: (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </>
      ),
    },
    {
      label: 'Present today',
      value: summary.presentToday,
      sub: '↑ Updated live',
      color: 'var(--green)',
      bg: 'var(--green-bg)',
      accent: 'var(--green)',
      icon: (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </>
      ),
    },
    {
      label: 'Absent today',
      value: summary.absentToday,
      sub: 'Not yet marked',
      color: 'var(--red)',
      bg: 'var(--red-bg)',
      accent: 'var(--red)',
      icon: (
        <>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8"  x2="12"   y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </>
      ),
    },
    {
      label: 'Attendance rate',
      value: `${summary.attendanceRate}%`,
      sub: 'Overall today',
      color: 'var(--amber)',
      bg: 'var(--amber-bg)',
      accent: 'var(--amber)',
      icon: (
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      ),
    },
  ]

  const depts     = summary.deptBreakdown?.length
    ? summary.deptBreakdown
    : [{ _id: 'CSE', count: 0 }, { _id: 'ECE', count: 0 }, { _id: 'MECH', count: 0 }]

  const deptColors  = ['var(--indigo)', 'var(--cyan)', 'var(--amber)', 'var(--purple)', 'var(--green)']
  const maxCount    = Math.max(...depts.map(d => d.count), 1)

  const avatarColors = [
    { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
    { bg: 'rgba(34,211,238,0.08)', color: '#67e8f9' },
    { bg: 'rgba(245,166,35,0.08)', color: '#fcd34d' },
    { bg: 'rgba(167,139,250,0.1)', color: '#c4b5fd' },
    { bg: 'rgba(16,217,136,0.08)', color: '#4ade80' },
  ]

  if (loading)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--tx3)', fontSize: 13 }}>Loading dashboard...</span>
      </div>
    )

  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-accent" style={{ background: s.accent }} />
            <StatIcon color={s.color} bg={s.bg}>{s.icon}</StatIcon>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub"   style={{ color: s.color, opacity: .65 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
        {/* ── Department breakdown ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Department breakdown</div>
            <div className="panel-tag" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)' }}>
              Today
            </div>
          </div>
          {depts.map((d, i) => (
            <div className="bar-row" key={d._id}>
              <div className="bar-name">{d._id}</div>
              <div className="bar-track">
                <div className="bar-fill"
                  style={{ width: `${(d.count / maxCount) * 100}%`, background: deptColors[i % deptColors.length] }}
                />
              </div>
              <div className="bar-count">{d.count}</div>
            </div>
          ))}
        </div>

        {/* ── Recent check-ins ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Recent check-ins</div>
            <div className="panel-tag"
              style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(16,217,136,0.2)' }}>
              ● Live
            </div>
          </div>
          {recent.length === 0
            ? <div className="empty-state"><p>No attendance marked today yet</p></div>
            : recent.map((r, i) => {
                const av       = avatarColors[i % avatarColors.length]
                const initials = r.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div className="checkin-row" key={r._id}>
                    <div className="c-av" style={av}>{initials}</div>
                    <div>
                      <div className="c-name">{r.name}</div>
                      <div className="c-dept">{r.department} · {r.rollNumber}</div>
                    </div>
                    <div className="c-time">{r.time}</div>
                    <div className="c-check">
                      <svg width="10" height="10" viewBox="0 0 24 24"
                        fill="none" stroke="var(--green)" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
