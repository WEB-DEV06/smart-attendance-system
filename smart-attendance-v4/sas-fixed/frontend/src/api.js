import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
})

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

// Students
export const getStudents = (params) => api.get('/api/students', { params })
export const getStudentsWithDescriptors = () => api.get('/api/students/with-descriptors')
export const getStudent = (id) => api.get(`/api/students/${id}`)
export const registerStudent = (data) => api.post('/api/students', data)
export const updateStudent = (id, data) => api.put(`/api/students/${id}`, data)
export const deleteStudent = (id) => api.delete(`/api/students/${id}`)

// Attendance
export const getSummary = () => api.get('/api/attendance/summary')
export const getAttendance = (params) => api.get('/api/attendance', { params })
export const markAttendance = (studentId, confidence) => api.post('/api/attendance', { studentId, confidence })
export const deleteAttendance = (id) => api.delete(`/api/attendance/${id}`)

export default api
