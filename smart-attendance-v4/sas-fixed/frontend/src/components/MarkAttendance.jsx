import { useRef, useState, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import { getStudentsWithDescriptors, markAttendance, getAttendance } from '../api'
import { loadModels } from '../faceModels'

const AV_COLORS = [
  { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
  { bg: 'rgba(34,211,238,0.08)', color: '#67e8f9' },
  { bg: 'rgba(245,166,35,0.08)', color: '#fcd34d' },
  { bg: 'rgba(167,139,250,0.1)',  color: '#c4b5fd' },
  { bg: 'rgba(16,217,136,0.08)', color: '#4ade80' },
]

export default function MarkAttendance() {
  const videoRef    = useRef()
  const canvasRef   = useRef()
  const intervalRef = useRef()
  const matcherRef  = useRef(null)

  const [running,    setRunning]    = useState(false)
  const [recogState, setRecogState] = useState('idle')
  const [recogLabel, setRecogLabel] = useState('Press start to initialise face recognition')
  const [status,     setStatus]     = useState({ type: '', msg: 'System ready' })
  const [matched,    setMatched]    = useState(null)
  const [markedList, setMarkedList] = useState([])

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    getAttendance({ date: today, limit: 10 })
      .then(r => setMarkedList(r.data))
      .catch(() => {})
    return () => {
      clearInterval(intervalRef.current)
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 900; o.type = 'sine'
      g.gain.setValueAtTime(0.4, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
    } catch (_) {}
  }

  const start = async () => {
    try {
      setStatus({ type: 'warn', msg: 'Loading face recognition models...' })

      await loadModels(msg => setStatus({ type: 'warn', msg }))

      const { data: students } = await getStudentsWithDescriptors()
      if (!students.length)
        return setStatus({ type: 'err', msg: 'No students registered yet. Register a student first.' })

      const labeled = students
        .filter(s => s.faceDescriptor?.length === 128)
        .map(s => new faceapi.LabeledFaceDescriptors(
          JSON.stringify({ id: s._id, name: s.name, roll: s.rollNumber, dept: s.department }),
          [new Float32Array(s.faceDescriptor)]
        ))

      if (!labeled.length)
        return setStatus({ type: 'err', msg: 'No face data found. Please re-register students.' })

      matcherRef.current = new faceapi.FaceMatcher(labeled, 0.5)

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } })
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setRunning(true)
      setRecogState('scanning')
      setRecogLabel('Scanning for registered faces…')
      setStatus({ type: 'warn', msg: 'Recognition active — processing frames' })

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return
        const detections = await faceapi
          .detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors()

        const dims = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight }
        const resized = faceapi.resizeResults(detections, dims)
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, dims.width, dims.height)
        faceapi.draw.drawDetections(canvasRef.current, resized)

        for (const d of resized) {
          if (!matcherRef.current) continue
          const match = matcherRef.current.findBestMatch(d.descriptor)
          if (match.label !== 'unknown') {
            const info = JSON.parse(match.label)
            const confidence = Math.round((1 - match.distance) * 100)
            try {
              const res = await markAttendance(info.id, confidence)
              setRecogState('found')
              setMatched(info)
              setRecogLabel('Match found!')
              setStatus({ type: 'ok', msg: `Attendance marked: ${info.name}` })
              playBeep()
              setMarkedList(p => [res.data.record, ...p].slice(0, 10))
            } catch (err) {
              if (err.response?.status === 409) {
                setRecogLabel(`Already marked: ${info.name}`)
                setStatus({ type: 'warn', msg: `${info.name} already marked for today` })
              }
            }
          } else {
            setRecogLabel('Unknown face detected')
            setStatus({ type: 'warn', msg: 'Unrecognised face — ensure student is registered' })
          }
        }
      }, 2000)
    } catch (err) {
      setStatus({ type: 'err', msg: `Error: ${err.message}` })
      setRunning(false)
      setRecogState('idle')
    }
  }

  const stop = () => {
    clearInterval(intervalRef.current)
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    setRunning(false)
    setRecogState('idle')
    setRecogLabel('Press start to initialise face recognition')
    setStatus({ type: '', msg: 'Recognition stopped' })
    setMatched(null)
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, alignItems: 'start' }}>
      {/* Recognition panel */}
      <div className="panel">
        <div className="panel-header"><div className="panel-title">Face recognition</div></div>

        <div className="face-ring-wrap">
          <div className={`face-ring ${recogState}`}>
            <div className="scan-bar" />
            <div className="face-corner2 tl"/><div className="face-corner2 tr"/>
            <div className="face-corner2 bl"/><div className="face-corner2 br"/>
            <div className="face-inner">
              <video ref={videoRef} width={100} height={100}
                style={{ display: running ? 'block' : 'none', objectFit: 'cover', borderRadius: '50%', width: '100%', height: '100%' }}
              />
              {!running && (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="1.2">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="recog-lbl">{recogLabel}</div>

        {matched && (
          <div className="match-badge">
            <div className="match-name">{matched.name}</div>
            <div className="match-roll">{matched.roll} · {matched.dept}</div>
          </div>
        )}

        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className={`btn ${running ? 'btn-danger' : 'btn-primary'}`} onClick={running ? stop : start}>
            {running
              ? <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  Stop
                </>
              : <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Start recognition
                </>
            }
          </button>
        </div>

        <div className={`status-bar ${status.type}`} style={{ justifyContent: 'center', marginTop: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {status.type === 'ok'
              ? <polyline points="20 6 9 17 4 12"/>
              : status.type === 'err'
                ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                : <circle cx="12" cy="12" r="10"/>
            }
          </svg>
          {status.msg}
        </div>
      </div>

      {/* Marked today panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Marked today</div>
          <div className="panel-tag" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
            {markedList.length} present
          </div>
        </div>

        {markedList.length === 0
          ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <p>No attendance marked yet today</p>
            </div>
          )
          : markedList.map((r, i) => {
              const av = AV_COLORS[i % AV_COLORS.length]
              const initials = r.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div className="marked-card" key={r._id || i}>
                  <div className="m-av" style={av}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="m-name">{r.name}</div>
                    <div className="m-meta">{r.rollNumber} · {r.department}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="m-time-val">{r.time}</div>
                    <div className="conf-mini">
                      <div className="conf-mini-fill" style={{ width: `${r.confidence || 85}%` }} />
                    </div>
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
