# 💻 FRONTEND SETUP GUIDE - DIABINSIGHT

**Status:** ⏳ Framework ready | ⏳ Components pending | ⏳ API integration pending

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Visit: http://localhost:5173
```

---

## Architecture

### Tech Stack
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context + useState
- **HTTP Client:** Axios
- **Charts:** Recharts (for risk score visualization)
- **Forms:** React Hook Form + Zod (validation)

### Directory Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Header, Footer, Navigation
│   │   ├── forms/          # Form components
│   │   ├── cards/          # Card/widget components
│   │   └── charts/         # Data visualization
│   ├── pages/              # Page-level components
│   │   ├── Landing.jsx     # Home page
│   │   ├── Register.jsx    # User registration
│   │   ├── DailyCheckin.jsx # Daily questionnaire
│   │   ├── Results.jsx     # Risk score dashboard
│   │   ├── Recommendations.jsx
│   │   └── DFUScan.jsx     # Image upload
│   ├── hooks/              # Custom React hooks
│   │   ├── useAPI.js       # API calls wrapper
│   │   ├── useUser.js      # User context
│   │   └── useLocalStorage.js
│   ├── contexts/           # React Context
│   │   └── UserContext.jsx
│   ├── services/           # API client
│   │   └── api.js          # Axios configuration
│   ├── utils/              # Utilities
│   │   ├── formatting.js
│   │   └── validation.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

---

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

**Core Dependencies Added (in package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## Step 2: Create API Client

**File:** `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests (when implemented)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const healthCheck = () => apiClient.get('/health');
export const registerUser = (userData) => apiClient.post('/users/register', userData);
export const getUserProfile = (userId) => apiClient.get(`/users/${userId}`);
export const submitDailyCheckin = (data) => apiClient.post('/checkin/daily', data);
export const getCheckinHistory = (userId) => apiClient.get(`/checkin/history/${userId}`);
export const predictDiabetes = (userId) => apiClient.post('/predict/diabetes', { user_id: userId });
export const getPredictionHistory = (userId) => apiClient.get(`/predict/history/${userId}`);
export const getRecommendations = (userId) => apiClient.get(`/recommendations/${userId}`);
export const uploadDFUScan = (userId, imageFile) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('file', imageFile);
  return apiClient.post('/dfu/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const submitInsoleReading = (data) => apiClient.post('/insole/reading', data);

export default apiClient;
```

---

## Step 3: Create User Context

**File:** `frontend/src/contexts/UserContext.jsx`

```javascript
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('user_id');
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  const login = (newUserId) => {
    setUserId(newUserId);
    localStorage.setItem('user_id', newUserId);
  };

  const logout = () => {
    setUserId(null);
    setUserProfile(null);
    localStorage.removeItem('user_id');
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        userProfile,
        setUserProfile,
        isLoading,
        setIsLoading,
        error,
        setError,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
```

---

## Step 4: Create Core Pages

### Page 1: Landing/Registration

**File:** `frontend/src/pages/Register.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { UserContext } from '../contexts/UserContext';

const Register = () => {
  const navigate = useNavigate();
  const { login, setError } = React.useContext(UserContext);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    bmi: '',
    family_history_diabetes: false,
    smoking_status: 'Never',
    hypertension_history: false,
    cardiovascular_history: false,
    ethnicity: 'Asian',
    education_level: 'Highschool',
    income_level: 'Middle',
    employment_status: 'Employed',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await registerUser(formData);
      login(response.data.user_id);
      navigate('/checkin');
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Register for DiabInsight</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Age */}
          <input
            type="number"
            name="age"
            placeholder="Age"
            min="18"
            max="100"
            value={formData.age}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Gender */}
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          {/* BMI */}
          <input
            type="number"
            name="bmi"
            placeholder="BMI"
            step="0.1"
            min="10"
            max="60"
            value={formData.bmi}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Checkboxes */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="family_history_diabetes"
              checked={formData.family_history_diabetes}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span>Family history of diabetes</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
```

### Page 2: Daily Check-in

**File:** `frontend/src/pages/DailyCheckin.jsx`

```javascript
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitDailyCheckin, getCheckinHistory } from '../services/api';
import { UserContext } from '../contexts/UserContext';

const DailyCheckin = () => {
  const navigate = useNavigate();
  const { userId } = useContext(UserContext);
  const [day, setDay] = useState(1);
  const [formData, setFormData] = useState({
    diet_score: 5,
    physical_activity_minutes: 30,
    sleep_hours: 7,
    screen_time_hours: 6,
    hydration_glasses: 8,
    stress_level: 3,
  });
  const [loading, setLoading] = useState(false);
  const [completedDays, setCompletedDays] = useState(0);

  // Check progress on mount
  React.useEffect(() => {
    const checkProgress = async () => {
      try {
        const response = await getCheckinHistory(userId);
        setCompletedDays(response.data.entries.length);
        setDay(response.data.entries.length + 1);
      } catch (error) {
        console.error('Error checking progress:', error);
      }
    };
    if (userId) checkProgress();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await submitDailyCheckin({
        user_id: userId,
        ...formData,
      });
      
      setCompletedDays(completedDays + 1);
      
      if (completedDays + 1 >= 7) {
        navigate('/results');
      } else {
        setDay(day + 1);
        // Reset form for next day
        setFormData({
          diet_score: 5,
          physical_activity_minutes: 30,
          sleep_hours: 7,
          screen_time_hours: 6,
          hydration_glasses: 8,
          stress_level: 3,
        });
      }
    } catch (error) {
      alert('Error submitting check-in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Daily Check-in</h1>
          <p className="text-gray-600">Day {day} of 7</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${(completedDays / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Diet Score */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Diet Quality (1-10): {formData.diet_score}
            </label>
            <input
              type="range"
              name="diet_score"
              min="1"
              max="10"
              value={formData.diet_score}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          {/* Physical Activity */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Physical Activity (minutes)
            </label>
            <input
              type="number"
              name="physical_activity_minutes"
              min="0"
              max="480"
              value={formData.physical_activity_minutes}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Sleep Hours */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Sleep Hours
            </label>
            <input
              type="number"
              name="sleep_hours"
              min="0"
              max="12"
              step="0.5"
              value={formData.sleep_hours}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Saving...' : completedDays + 1 >= 7 ? 'Get Results' : 'Next Day'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DailyCheckin;
```

### Page 3: Results Dashboard

**File:** `frontend/src/pages/Results.jsx`

```javascript
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictDiabetes, getPredictionHistory } from '../services/api';
import { UserContext } from '../contexts/UserContext';

const Results = () => {
  const navigate = useNavigate();
  const { userId } = useContext(UserContext);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getPrediction = async () => {
      try {
        const response = await predictDiabetes(userId);
        setPrediction(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) getPrediction();
  }, [userId]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-20">Error: {error}</div>;
  if (!prediction) return <div className="text-center py-20">No prediction available</div>;

  const getRiskColor = (category) => {
    const colors = { Low: 'green', Moderate: 'yellow', High: 'red' };
    return colors[category] || 'gray';
  };

  const riskColor = getRiskColor(prediction.risk_category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Risk Card */}
        <div className={`bg-${riskColor}-100 border-2 border-${riskColor}-500 rounded-lg shadow-lg p-6 mb-6`}>
          <h1 className="text-2xl font-bold mb-4">Your Diabetes Risk Assessment</h1>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-5xl font-bold text-${riskColor}-700`}>
                {(prediction.risk_score * 100).toFixed(1)}%
              </div>
              <p className="text-gray-600 mt-2">Risk Score</p>
            </div>

            <div className="text-center">
              <p className={`text-2xl font-semibold text-${riskColor}-700`}>
                {prediction.risk_category}
              </p>
              <p className="text-gray-600">Risk Level</p>
            </div>

            <div>
              <p className="text-gray-700"><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%</p>
              <p className="text-gray-700"><strong>Predicted Stage:</strong> {prediction.predicted_stage}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">What's Next?</h2>
          
          <button
            onClick={() => navigate('/recommendations')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold mb-3"
          >
            View Personalized Recommendations
          </button>

          <button
            onClick={() => navigate('/dfu-scan')}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-semibold"
          >
            Scan for Foot Ulcers (Phase 3)
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-gray-700">
            <strong>Note:</strong> This assessment is based on your 7-day activity data. 
            For a clinical diagnosis, please consult your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;
```

---

## Step 5: Create Component Library

### Common Component: Header

**File:** `frontend/src/components/common/Header.jsx`

```javascript
import React from 'react';
import { useNavigate, useContext } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';

const Header = () => {
  const navigate = useNavigate();
  const { userId, logout } = useContext(UserContext);

  return (
    <header className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
          🏥 DiabInsight
        </h1>
        
        {userId && (
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="bg-red-500 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
```

---

## Step 6: Setup App Router

**File:** `frontend/src/App.jsx`

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, UserContext } from './contexts/UserContext';
import Header from './components/common/Header';
import Register from './pages/Register';
import DailyCheckin from './pages/DailyCheckin';
import Results from './pages/Results';
import Recommendations from './pages/Recommendations';
import DFUScan from './pages/DFUScan';

const ProtectedRoute = ({ children }) => {
  const { userId } = React.useContext(UserContext);
  return userId ? children : <Navigate to="/" />;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Register />} />
          <Route
            path="/checkin"
            element={
              <ProtectedRoute>
                <DailyCheckin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dfu-scan"
            element={
              <ProtectedRoute>
                <DFUScan />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
```

---

## Step 7: Environment Setup

**File:** `frontend/.env.local`

```env
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=DiabInsight
```

---

## Running the Frontend

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Pages to Implement (Detailed)

1. ✅ **Register.jsx** - User demographics collection
2. ✅ **DailyCheckin.jsx** - 7-day questionnaire
3. ✅ **Results.jsx** - Risk score display
4. ⏳ **Recommendations.jsx** - Lifestyle suggestions
5. ⏳ **DFUScan.jsx** - Image upload for DFU detection
6. ⏳ **Dashboard.jsx** - Historical data view

---

## Testing Frontend

```bash
# Run unit tests
npm run test

# Build and test
npm run build && npm run preview
```

---

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## Next Steps

1. Create remaining pages (Recommendations, DFUScan, Dashboard)
2. Add form validation with React Hook Form
3. Implement error handling and loading states
4. Add charts with Recharts
5. Style with Tailwind CSS
6. Deploy to Vercel

**Estimated Time:** 4-6 hours for full implementation

