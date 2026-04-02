import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
export const getStudents = (params) => api.get('/students', { params })
export const getStudentsWithDescriptors = () => api.get('/students/with-descriptors')
export const getStudent = (id) => api.get(`/students/${id}`)
export const registerStudent = (data) => api.post('/students', data)
export const updateStudent = (id, data) => api.put(`/students/${id}`, data)
export const deleteStudent = (id) => api.delete(`/students/${id}`)

// Attendance
export const getSummary = () => api.get('/attendance/summary')
export const getAttendance = (params) => api.get('/attendance', { params })
export const markAttendance = (studentId, confidence) => api.post('/attendance', { studentId, confidence })
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`)

export default api
