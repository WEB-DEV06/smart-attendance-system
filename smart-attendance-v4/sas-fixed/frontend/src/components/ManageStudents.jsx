import { useEffect, useState } from 'react'
import { getStudents, deleteStudent, updateStudent } from '../api'

const AV_COLORS = [
  { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
  { bg: 'rgba(34,211,238,0.08)', color: '#67e8f9' },
  { bg: 'rgba(245,166,35,0.08)', color: '#fcd34d' },
  { bg: 'rgba(240,90,90,0.08)',  color: '#f87171' },
  { bg: 'rgba(167,139,250,0.1)', color: '#c4b5fd' },
  { bg: 'rgba(16,217,136,0.08)', color: '#4ade80' },
]

const DEPT_BADGE = {
  CSE: 'badge-indigo', ECE: 'badge-teal', MECH: 'badge-amber',
  CIVIL: 'badge-purple', IT: 'badge-green',
}

export default function ManageStudents({ onCountChange }) {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [editing,  setEditing]  = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving,   setSaving]   = useState(false)
  const [status,   setStatus]   = useState({ type: '', msg: '' })

  const load = async (q = '') => {
    setLoading(true)
    try {
      const res = await getStudents(q ? { search: q } : {})
      setStudents(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the system?`)) return
    try {
      await deleteStudent(id)
      setStatus({ type: 'ok', msg: `${name} removed successfully` })
      load()
      onCountChange?.()
    } catch (e) {
      setStatus({ type: 'err', msg: e.response?.data?.error || e.message })
    }
  }

  const startEdit = (s) => {
    setEditing(s._id)
    setEditForm({ name: s.name, department: s.department, mobile: s.mobile })
  }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      await updateStudent(id, editForm)
      setStatus({ type: 'ok', msg: 'Student updated successfully' })
      setEditing(null)
      load()
    } catch (e) {
      setStatus({ type: 'err', msg: e.response?.data?.error || e.message })
    } finally { setSaving(false) }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">All registered students</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>{students.length} total</span>
        </div>
      </div>

      {/* Search + status */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="field-input"
            placeholder="Search by name, roll no. or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>
        <button className="btn btn-outline" onClick={() => load(search)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-4.97"/>
          </svg>
          Refresh
        </button>
      </div>

      {status.msg && (
        <div className={`status-bar ${status.type}`} style={{ marginBottom: 14 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            {status.type === 'ok' ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="10"/>}
          </svg>
          {status.msg}
          <button onClick={() => setStatus({ type: '', msg: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {loading
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '30px 0' }}><div className="spinner" /><span style={{ color: 'var(--text3)', fontSize: 13 }}>Loading students...</span></div>
        : filtered.length === 0
          ? <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p>{search ? 'No students match your search' : 'No students registered yet'}</p>
            </div>
          : (
            <div className="mg-grid">
              {filtered.map((s, i) => {
                const av = AV_COLORS[i % AV_COLORS.length]
                const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                const deptClass = DEPT_BADGE[s.department?.toUpperCase()] || 'badge-indigo'
                const isEditing = editing === s._id

                return (
                  <div className="mg-card" key={s._id}>
                    <div className="mg-av" style={av}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <>
                          <input className="edit-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 4 }} />
                          <input className="edit-input" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} placeholder="Department" style={{ marginBottom: 4 }} />
                          <input className="edit-input" value={editForm.mobile} onChange={e => setEditForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile" />
                        </>
                      ) : (
                        <>
                          <div className="mg-name">{s.name}</div>
                          <div className="mg-info">{s.rollNumber} · {s.mobile}</div>
                          <div style={{ marginTop: 5 }}><span className={`badge ${deptClass}`}>{s.department}</span></div>
                        </>
                      )}
                    </div>
                    <div className="mg-actions">
                      {isEditing ? (
                        <>
                          <button className="mg-btn" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(16,217,136,0.25)' }}
                            onClick={() => saveEdit(s._id)} disabled={saving}>
                            {saving ? '…' : '✓ Save'}
                          </button>
                          <button className="mg-btn mg-del" onClick={() => setEditing(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <button className="mg-btn mg-edit" onClick={() => startEdit(s)}>Edit</button>
                          <button className="mg-btn mg-del" onClick={() => handleDelete(s._id, s.name)}>Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}
