# AttendIQ – Smart Attendance System v2.4.1

A full-stack Smart Attendance System with **face recognition**, collapsible sidebar, dark/light mode toggle in the top bar, real-time dashboard, and PDF export.

---

## What's New in This Version
- Sidebar toggle button (top-left hamburger) — collapse/expand with smooth animation
- Dark/Light mode switch moved to the top-right navbar
- Topbar always visible with brand, page title, live status chip, and location chip

---

## Project Structure

```
smart-attendance-system/
│
├── backend/                          ← Node.js + Express API
│   ├── models/
│   │   ├── Student.js                ← Student schema (name, roll, dept, face descriptor)
│   │   └── Attendance.js             ← Attendance schema (1 record/student/day enforced)
│   ├── routes/
│   │   ├── students.js               ← GET/POST/PUT/DELETE for students
│   │   └── attendance.js             ← Mark, fetch, summary endpoints
│   ├── .env                          ← MONGO_URI and PORT config
│   ├── server.js                     ← Express app entry point
│   └── package.json
│
└── frontend/                         ← React + Vite app
    ├── public/
    │   └── models/                   ← ⚠️ Put face-api.js model weights here
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx         ← Stats cards, dept bars, live check-ins
    │   │   ├── RegisterStudent.jsx   ← Form + webcam capture + face encoding
    │   │   ├── MarkAttendance.jsx    ← Real-time face recognition loop
    │   │   ├── ViewRecords.jsx       ← Filterable table + PDF export
    │   │   └── ManageStudents.jsx    ← Edit/remove students inline
    │   ├── App.jsx                   ← Layout: topnav + sidebar + routing
    │   ├── App.css                   ← All component styles + theme variables
    │   ├── index.css                 ← CSS custom properties for dark/light mode
    │   ├── api.js                    ← Axios API helpers
    │   └── main.jsx                  ← React entry point
    ├── index.html
    ├── vite.config.js                ← Vite + proxy to backend
    └── package.json
```

---

## Step-by-Step Setup (Beginner Friendly)

### Step 1 — Install Prerequisites

You need these installed before starting:

| Tool       | Download link                          | Why needed           |
|------------|----------------------------------------|----------------------|
| Node.js    | https://nodejs.org (choose LTS)        | Runs backend + Vite  |
| MongoDB    | https://www.mongodb.com/try/download/community | Database   |
| Chrome     | https://www.google.com/chrome          | Best webcam support  |

After installing Node.js, verify it works:
```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

---

### Step 2 — Extract the Project

```bash
# Unzip the downloaded file
unzip smart-attendance-system.zip

# Go into the project folder
cd smart-attendance-system
```

---

### Step 3 — Start MongoDB

**macOS:**
```bash
brew services start mongodb-community
```
**Linux:**
```bash
sudo systemctl start mongod
```
**Windows (run as Administrator):**
```bash
net start MongoDB
```

**OR use MongoDB Atlas (free cloud — no installation needed):**
1. Go to https://cloud.mongodb.com → Sign up free
2. Create a free cluster → Get connection string
3. Paste it into `backend/.env` as `MONGO_URI=mongodb+srv://...`

---

### Step 4 — Download Face Recognition Models

> These are AI model weight files (~6 MB total). They are NOT included in the zip because of file size.

**Option A — Use curl (fastest):**
```bash
cd frontend/public/models

BASE=https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights

curl -O $BASE/ssd_mobilenetv1_model-weights_manifest.json
curl -O $BASE/ssd_mobilenetv1_model-shard1
curl -O $BASE/face_landmark_68_model-weights_manifest.json
curl -O $BASE/face_landmark_68_model-shard1
curl -O $BASE/face_recognition_model-weights_manifest.json
curl -O $BASE/face_recognition_model-shard1
curl -O $BASE/face_recognition_model-shard2
```

**Option B — Manual download:**
1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Click each file → "Raw" → Save to `frontend/public/models/`

---

### Step 5 — Install & Run Backend

Open a terminal in the project folder:
```bash
cd backend
npm install
npm run dev
```

You should see:
```
🚀 AttendIQ Server running on http://localhost:5000
✅ MongoDB connected successfully
```

Test: open http://localhost:5000/api/health in your browser. It should return `{"status":"ok"}`.

---

### Step 6 — Install & Run Frontend

Open a **second terminal** (keep the backend terminal running):
```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in Chrome.

---

## How to Use

### Register a Student
1. Click **Register Student** in the sidebar
2. Fill in name, roll number, department, mobile
3. Click **Open Camera** — allow browser camera permission when prompted
4. Position your face clearly in the frame
5. Click **Save Student**

### Mark Attendance
1. Click **Mark Attendance** in the sidebar
2. Click **Start Recognition**
3. A registered student stands in front of the webcam
4. System auto-detects and matches face → beep sound + attendance recorded
5. Each student is only marked **once per day** automatically

### View Reports
1. Click **View Records** in the sidebar
2. Filter by date, department, or search by name
3. Click **Export PDF** to download the attendance sheet

### Manage Students
1. Click **Manage Students** in the sidebar
2. Click **Edit** to update name/department/mobile inline
3. Click **Remove** to deactivate a student

### Toggle Dark/Light Mode
Click the **sun/moon button** in the **top-right of the navbar**. Your preference is saved automatically.

### Collapse Sidebar
Click the **hamburger menu button** (≡) at the **top-left of the navbar** to collapse or expand the sidebar.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Camera not opening | Use `http://localhost:5173`, not an IP. Chrome requires secure origin for webcam. |
| Face not detected | Good lighting, face fully visible, look directly at camera |
| "No face data found" | Re-register the student — face wasn't captured properly |
| Models not loading | Check all 7 files are in `frontend/public/models/` |
| MongoDB not connecting | Run `mongod` / `brew services start mongodb-community` |
| Port already in use | Change `PORT=5001` in `backend/.env` and `target` in `frontend/vite.config.js` |
| CORS error | Make sure backend is running on port 5000 |

---

## API Reference

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students | All active students |
| GET | /api/students/with-descriptors | With face data (for recognition) |
| POST | /api/students | Register new student |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Soft-delete student |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/attendance | Records (with date/dept/search filters) |
| GET | /api/attendance/summary | Dashboard stats |
| POST | /api/attendance | Mark attendance |
| DELETE | /api/attendance/:id | Delete a record |

---

## Environment Variables (`backend/.env`)
```
MONGO_URI=mongodb://localhost:27017/smart-attendance
PORT=5000
```
