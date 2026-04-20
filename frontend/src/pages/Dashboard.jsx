import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { getCheckinHistory, getPredictionHistory } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [predictions, setPredictions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchCheckinProgress();
  }, [user, navigate]);

  // Fetch predictions when History tab becomes active
  useEffect(() => {
    if (activeTab === 'history' && user?.user_id) {
      fetchPredictions();
    }
  }, [activeTab, user?.user_id]);

  const fetchCheckinProgress = async () => {
    try {
      setLoading(true);
      const response = await getCheckinHistory(user.user_id);
      setDaysCompleted(response.data.days_completed || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load progress');
      setDaysCompleted(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setHistoryLoading(true);
      const response = await getPredictionHistory(user.user_id);
      setPredictions(response.data.predictions || []);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
      setPredictions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartAssessment = () => {
    navigate('/daily-checkin');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Test endpoints handlers
  const handlePopulateTestData = async () => {
    try {
      setTestLoading(true);
      setTestMessage('');
      const response = await fetch(
        `http://localhost:8000/api/v1/test/populate-days/${user.user_id}?num_days=6`,
        { method: 'POST' }
      );
      const data = await response.json();
      setTestMessage('✅ Test data created! Now submit Day 7 to test the complete flow.');
      setDaysCompleted(6);
      setTimeout(() => setTestMessage(''), 3000);
    } catch (err) {
      setTestMessage('❌ Failed to populate test data');
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  const handleClearTestData = async () => {
    try {
      setTestLoading(true);
      setTestMessage('');
      const response = await fetch(
        `http://localhost:8000/api/v1/test/clear-entries/${user.user_id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      setTestMessage('✅ All entries cleared! Ready for fresh testing.');
      setDaysCompleted(0);
      setTimeout(() => setTestMessage(''), 3000);
    } catch (err) {
      setTestMessage('❌ Failed to clear test data');
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 mb-0">
            <h1 className="text-xl font-bold text-blue-600">DiabInsight</h1>
            
            {/* Navigation Links with Tab Indicator */}
            <div className="hidden md:flex gap-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-4 font-medium transition border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium transition border-b-2 ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-4 font-medium transition border-b-2 ${
                  activeTab === 'resources'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Resources
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile
              </button>
            </div>

            {/* Right Side Icons and Logout */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition" title="Notifications">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition" title="Settings">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition font-semibold text-sm"
                title={`Logout (${user.name})`}
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Greeting Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Hello, {user.name}
              </h1>
              <p className="text-gray-600">
                Welcome back to your personalized health guardian. Let's take the first step toward clarity today.
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Section - Assessment (2 columns) */}
              <div className="lg:col-span-2">
                {/* New Journey Badge */}
                {daysCompleted === 0 && (
                  <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                    🟢 New Journey
                  </div>
                )}

                {/* 7-Day Assessment Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    7-Day Diabetes Risk Assessment
                  </h2>
                  <p className="text-gray-600 mb-6">
                    A comprehensive diagnostic sprint to understand your metabolic health.
                  </p>

                  {/* Progress */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        {daysCompleted}/7
                      </span>
                      <span className="text-sm text-gray-600 font-semibold">
                        DAYS COMPLETED
                      </span>
                    </div>
                    
                    {/* Days Timeline */}
                    <div className="flex justify-between items-end gap-2 mb-6">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full transition ${
                            i < daysCompleted
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Day 1</span>
                      <span>Day 7</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {daysCompleted < 7 && (
                    <button
                      onClick={handleStartAssessment}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
                    >
                      Start {daysCompleted === 0 ? 'Day 1' : `Day ${daysCompleted + 1}`} Assessment →
                    </button>
                  )}

                  {daysCompleted === 7 && (
                    <button
                      onClick={() => navigate('/results')}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      View Results 🎉
                    </button>
                  )}
                </div>

                {/* Recent Insights Section */}
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Insights</h3>
                  <p className="text-gray-600 mb-6">
                    Once you begin your assessment, AI-driven insights and clinical recommendations will appear here.
                  </p>
                  {/* Placeholder dots */}
                  <div className="flex gap-2 justify-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Right Section - Health Profile & DFU (1 column) */}
              <div className="space-y-8">
                {/* Health Profile Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Health Profile</h3>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  {/* Profile Items */}
                  <div className="space-y-5">
                    {/* BMI Status */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">⚖️</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">BMI Status</p>
                          <p className="font-semibold text-gray-900">
                            {user.bmi ? `${user.bmi} ${user.bmi < 18.5 ? 'Underweight' : user.bmi < 25 ? 'Healthy' : user.bmi < 30 ? 'Overweight' : 'Obese'}` : 'Not Set'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Age */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">📅</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Age</p>
                          <p className="font-semibold text-gray-900">{user.age ? `${user.age} years` : 'Not Set'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Family History */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">👨‍👩‍👧</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Family History</p>
                          <p className="font-semibold text-gray-900">
                            {user.family_history_diabetes ? 'Diabetes: Yes' : 'Diabetes: No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Update Profile Link */}
                  <button onClick={() => setActiveTab('profile')} className="mt-6 w-full text-center text-blue-600 font-semibold hover:text-blue-700 transition">
                    Update Profile
                  </button>
                </div>

                {/* DFU Scan Card */}
                <div className="bg-teal-700 rounded-2xl p-8 shadow-lg text-white overflow-hidden relative">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-teal-600 rounded-full -mr-20 -mt-20 opacity-20"></div>
                  
                  <div className="relative z-10">
                    {/* Header with icon */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold">Foot Ulcer (DFU) Scan</h3>
                      <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-teal-100 text-sm mb-6">
                      Early detection of diabetic foot ulcers using computer vision technology. Screen foot images instantly for precise assessment.
                    </p>

                    {/* Explore Feature Button */}
                    <button 
                      onClick={() => navigate('/dfu-scan')}
                      className="text-white font-semibold hover:text-teal-100 transition flex items-center gap-2"
                    >
                      Start Scan →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Assessment History</h1>
            
            {historyLoading ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading assessments...</p>
              </div>
            ) : predictions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assessment History Yet</h3>
                  <p className="text-gray-600 mb-6">Once you complete assessments, your history will appear here.</p>
                  <button
                    onClick={handleStartAssessment}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Start Assessment
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {predictions.map((pred, index) => {
                  const riskColor = pred.risk_score < 0.35 ? 'green' : pred.risk_score < 0.65 ? 'yellow' : 'red';
                  const riskColorClass = riskColor === 'green' ? 'bg-green-50 border-green-300' : riskColor === 'yellow' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300';
                  const riskBg = riskColor === 'green' ? 'bg-green-100' : riskColor === 'yellow' ? 'bg-yellow-100' : 'bg-red-100';
                  
                  return (
                    <div key={index} className={`border-2 ${riskColorClass} rounded-2xl p-6 shadow-sm hover:shadow-md transition`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Assessment #{predictions.length - index}</h3>
                        <span className={`${riskBg} px-3 py-1 rounded-full text-sm font-semibold`}>
                          {(pred.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {new Date(pred.predicted_at).toLocaleDateString()} {new Date(pred.predicted_at).toLocaleTimeString()}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Risk Level:</span>
                          <span className="font-semibold">{pred.risk_category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-semibold">{(pred.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${riskColor === 'green' ? 'bg-green-500' : riskColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`}
                          style={{ width: `${pred.risk_score * 100}%` }}
                        ></div>
                      </div>
                      
                      <button
                        onClick={() => navigate('/results')}
                        className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Health Resources</h1>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Diabetes Education</h3>
                <p className="text-gray-600 mb-4">Learn about diabetes prevention, management, and lifestyle changes.</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700 transition">Learn More →</button>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🥗</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nutrition Guide</h3>
                <p className="text-gray-600 mb-4">Healthy eating patterns and meal planning tips for diabetes management.</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700 transition">Learn More →</button>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🏃</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Exercise Tips</h3>
                <p className="text-gray-600 mb-4">Workout routines and physical activity recommendations.</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700 transition">Learn More →</button>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🏥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Medical Support</h3>
                <p className="text-gray-600 mb-4">Find healthcare providers and support groups near you.</p>
                <button className="text-blue-600 font-semibold hover:text-blue-700 transition">Learn More →</button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Header */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-3xl font-bold">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                      <button className="mt-4 text-blue-600 font-semibold hover:text-blue-700 transition">Edit Profile</button>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Full Name</p>
                      <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Email Address</p>
                      <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Age</p>
                      <p className="text-lg font-semibold text-gray-900">{user.age ? `${user.age} years` : 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Gender</p>
                      <p className="text-lg font-semibold text-gray-900">{user.gender || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">BMI</p>
                      <p className="text-lg font-semibold text-gray-900">{user.bmi ? `${user.bmi} kg/m²` : 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Ethnicity</p>
                      <p className="text-lg font-semibold text-gray-900">{user.ethnicity || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Education Level</p>
                      <p className="text-lg font-semibold text-gray-900">{user.education_level || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Income Level</p>
                      <p className="text-lg font-semibold text-gray-900">{user.income_level || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Employment Status</p>
                      <p className="text-lg font-semibold text-gray-900">{user.employment_status || 'Not Set'}</p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Medical History</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Family History of Diabetes</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.family_history_diabetes ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.family_history_diabetes ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Hypertension History</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.hypertension_history ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.hypertension_history ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Cardiovascular History</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.cardiovascular_history ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.cardiovascular_history ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Smoking Status</span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                        {user.smoking_status || 'Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Account Settings */}
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium">
                      Change Password
                    </button>
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium">
                      Privacy Settings
                    </button>
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium">
                      Notification Settings
                    </button>
                  </div>
                </div>

                {/* Developer Tools */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>🛠️</span> Developer Tools
                  </h3>
                  <div className="space-y-3 mb-4">
                    <button
                      onClick={handlePopulateTestData}
                      disabled={testLoading}
                      className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testLoading ? 'Loading...' : 'Populate 6 Test Days'}
                    </button>
                    <button
                      onClick={handleClearTestData}
                      disabled={testLoading}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testLoading ? 'Loading...' : 'Clear All Entries'}
                    </button>
                    <button
                      onClick={handleStartAssessment}
                      className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition font-semibold"
                    >
                      Go to Day 7
                    </button>
                  </div>
                  {testMessage && (
                    <p className="text-sm text-amber-700 text-center font-medium">{testMessage}</p>
                  )}
                  <p className="text-xs text-amber-600 mt-4 text-center">
                    ⚠️ Development tools - Remove before production
                  </p>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h3>
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
