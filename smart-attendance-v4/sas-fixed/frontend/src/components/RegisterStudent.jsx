import { useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { registerStudent } from '../api'
import { loadModels } from '../faceModels'

export default function RegisterStudent() {
  const videoRef = useRef()
  const [cameraOn, setCameraOn]   = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [qualSegs, setQualSegs]   = useState(0)
  const [status,   setStatus]     = useState({ type: '', msg: '' })
  const [form,     setForm]       = useState({ name: '', rollNumber: '', department: '', mobile: '' })

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setMsg = (type, msg) => setStatus({ type, msg })

  const openCamera = async () => {
    try {
      setMsg('warn', 'Loading face recognition models...')
      await loadModels(msg => setMsg('warn', msg))

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOn(true)
      setMsg('', 'Camera ready — look directly at the camera')

      let n = 0
      const iv = setInterval(() => { if (n < 5) setQualSegs(++n); else clearInterval(iv) }, 200)
    } catch (err) {
      setMsg('err', err.message)
    }
  }

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    setCameraOn(false)
    setQualSegs(0)
  }

  const handleSave = async () => {
    if (!form.name || !form.rollNumber || !form.department || !form.mobile)
      return setMsg('err', 'Please fill in all fields before saving')
    if (!cameraOn)
      return setMsg('err', 'Please open the camera to capture face data')

    setLoading(true)
    setMsg('warn', 'Detecting face...')
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setLoading(false)
        return setMsg('err', 'No face detected — position your face clearly in the frame and try again')
      }

      const descriptor = Array.from(detection.descriptor)
      const canvas = document.createElement('canvas')
      canvas.width  = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
      const photo = canvas.toDataURL('image/jpeg', 0.6)

      await registerStudent({ ...form, faceDescriptor: descriptor, photo })
      setMsg('ok', `✓ ${form.name} registered successfully!`)
      setForm({ name: '', rollNumber: '', department: '', mobile: '' })
      stopCamera()
    } catch (err) {
      setMsg('err', err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
      {/* Form panel */}
      <div className="panel">
        <div className="panel-header"><div className="panel-title">Student information</div></div>
        <div className="form-grid">
          {[
            ['name',        'Full name',      'e.g. Aravind Kumar'],
            ['rollNumber',  'Roll number',    'e.g. CS2021001'],
            ['department',  'Department',     'e.g. Computer Science'],
            ['mobile',      'Mobile number',  'e.g. 9876543210'],
          ].map(([k, l, ph]) => (
            <div className="field" key={k}>
              <div className="field-label">{l}</div>
              <input className="field-input" placeholder={ph} value={form[k]}
                onChange={e => setF(k, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={cameraOn ? stopCamera : openCamera} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {cameraOn ? 'Close camera' : 'Open camera'}
          </button>
          <button className="btn btn-outline" onClick={handleSave} disabled={loading || !cameraOn}>
            {loading
              ? <><div className="spinner" style={{ width: 14, height: 14 }} />Saving...</>
              : <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                  </svg>
                  Save student
                </>
            }
          </button>
        </div>

        {status.msg && (
          <div className={`status-bar ${status.type}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {status.type === 'ok'
                ? <polyline points="20 6 9 17 4 12"/>
                : <circle cx="12" cy="12" r="10"/>
              }
            </svg>
            {status.msg}
          </div>
        )}
      </div>

      {/* Camera panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="panel-header" style={{ width: '100%' }}>
          <div className="panel-title">Face capture</div>
          {cameraOn && (
            <div className="panel-tag"
              style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(16,217,136,0.2)' }}>
              ● Live
            </div>
          )}
        </div>

        <div className={`cam-frame${cameraOn ? ' live' : ''}`} style={{ marginBottom: 14, maxWidth: 260 }}>
          <div className="cam-corner tl"/><div className="cam-corner tr"/>
          <div className="cam-corner bl"/><div className="cam-corner br"/>
          <video ref={videoRef} width={260} height={180}
            style={{ display: cameraOn ? 'block' : 'none', borderRadius: 12, objectFit: 'cover', width: '100%', height: '100%' }}
          />
          {!cameraOn && (
            <>
              <div className="cam-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div className="cam-txt">Camera inactive</div>
            </>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: 260 }}>
          <div className="field-label" style={{ marginBottom: 6 }}>Capture quality</div>
          <div className="quality-segments">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`q-seg${i < qualSegs ? ' lit' : ''}`} />
            ))}
          </div>
          <div className="conf-pct">{qualSegs * 20}% confidence</div>
        </div>
      </div>
    </div>
  )
}
