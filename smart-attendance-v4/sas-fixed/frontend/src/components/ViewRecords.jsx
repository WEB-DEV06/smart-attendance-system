import { useState, useEffect } from 'react'
import { getAttendance } from '../api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DEPT_BADGE = {
  CSE:  'badge-indigo', ECE: 'badge-teal', MECH: 'badge-amber',
  CIVIL:'badge-purple', IT:  'badge-green',
}

export default function ViewRecords() {
  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [filters, setFilters]     = useState({ date: new Date().toISOString().split('T')[0], department: '', search: '' })

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  const fetch = async (f = filters) => {
    setLoading(true)
    try {
      const params = {}
      if (f.date)       params.date       = f.date
      if (f.department) params.department = f.department
      if (f.search)     params.search     = f.search
      const res = await getAttendance(params)
      setRecords(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const downloadPDF = () => {
    const doc = new jsPDF()
    const dateStr = filters.date || 'All dates'

    // Header
    doc.setFillColor(99, 102, 241)
    doc.rect(0, 0, 220, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('AttendIQ – Attendance Report', 14, 12)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Date: ${dateStr}   |   Total: ${records.length} records`, 14, 22)

    autoTable(doc, {
      startY: 34,
      head: [['#', 'Name', 'Roll No.', 'Department', 'Date', 'Time', 'Status']],
      body: records.map((r, i) => [
        String(i + 1).padStart(3, '0'),
        r.name, r.rollNumber, r.department, r.date, r.time || '—', 'Present'
      ]),
      headStyles: { fillColor: [30, 32, 56], textColor: [165, 180, 252], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 80] },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      columnStyles: { 0: { cellWidth: 14 }, 6: { textColor: [16, 185, 129] } },
      margin: { left: 14, right: 14 },
    })

    doc.save(`attendance_${dateStr.replace(/-/g, '')}.pdf`)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Attendance records</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
            {records.length} records
          </span>
          <button className="btn btn-success" style={{ padding: '7px 13px', fontSize: 11 }} onClick={downloadPDF} disabled={records.length === 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="field">
          <div className="field-label">Date</div>
          <input type="date" className="field-input" value={filters.date} onChange={e => setF('date', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label">Department</div>
          <input className="field-input" placeholder="All departments" value={filters.department} onChange={e => setF('department', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label">Search</div>
          <input className="field-input" placeholder="Name or roll no." value={filters.search} onChange={e => setF('search', e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '9px 16px' }} onClick={() => fetch()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Search
        </button>
        <button className="btn btn-outline" style={{ alignSelf: 'flex-end', padding: '9px 14px' }} onClick={() => { setFilters({ date: '', department: '', search: '' }); fetch({ date: '', department: '', search: '' }) }}>
          Clear
        </button>
      </div>

      {/* Table */}
      {loading
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '30px 0' }}><div className="spinner" /><span style={{ color: 'var(--text3)', fontSize: 13 }}>Loading records...</span></div>
        : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student name</th>
                  <th>Roll no.</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No records found. Try changing filters.</td></tr>
                  : records.map((r, i) => {
                      const deptClass = DEPT_BADGE[r.department?.toUpperCase()] || 'badge-indigo'
                      return (
                        <tr key={r._id}>
                          <td className="mono" style={{ color: 'var(--text3)' }}>{String(i + 1).padStart(3, '0')}</td>
                          <td className="name">{r.name}</td>
                          <td className="mono">{r.rollNumber}</td>
                          <td><span className={`badge ${deptClass}`}>{r.department}</span></td>
                          <td className="mono">{r.date}</td>
                          <td className="mono">{r.time || '—'}</td>
                          <td><span className="badge badge-green">Present</span></td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
