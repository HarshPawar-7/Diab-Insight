import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useUser();

  // If user is logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-blue-600">DiabInsight</h1>
            
            {/* Center Navigation Links */}
            <div className="hidden md:flex gap-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition font-medium">Dashboard</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition font-medium">History</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition font-medium">Resources</a>
            </div>

            {/* Right Side - Auth Buttons */}
            <div className="flex gap-4 items-center">
              <Link
                to="/login"
                className="text-gray-700 px-4 py-2 hover:text-blue-600 transition font-medium"
              >
                Login
              </Link>
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              ✓ Phase 1 on-device AI & monitoring
            </div>

            {/* Title */}
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              The Future of<br />
              <span className="text-blue-600">Diabetes Care</span><br />
              Is Behavioral.
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              DiabInsight enables predictive monitoring with clinical rigor. Predict your risk, prevent complications, and protect your health with advanced computer vision screening.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
              >
                Get Started
              </button>
              <button
                className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-gray-400 transition font-semibold text-lg"
              >
                View Demo
              </button>
            </div>
          </div>

          {/* Right - App Mockup Image */}
          <div className="bg-gray-900 rounded-3xl p-6 shadow-2xl h-96 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📱</div>
              <p>App Preview</p>
            </div>
          </div>
        </div>

        {/* Advanced Predictive Capabilities Section */}
        <div className="mb-20 py-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Advanced Predictive Capabilities
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            Three integrated phases for comprehensive diabetes management and early detection
          </p>

          {/* Features Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 7-Day Behavioral Tracking */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
              <div className="bg-gray-100 h-48 rounded-lg mb-6 flex items-center justify-center text-4xl font-bold text-gray-400">
                {/* Placeholder for image */}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                7-Day Behavioral Tracking
              </h3>
              <p className="text-gray-600">
                Daily monitoring of lifestyle factors: diet, physical activity, sleep, stress levels, and hydration to build a comprehensive health profile.
              </p>
            </div>

            {/* Computer Vision DFU */}
            <div className="bg-teal-700 rounded-2xl p-8 shadow-lg text-white">
              <div className="flex justify-end mb-6">
                <div className="bg-teal-600 rounded-lg p-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                Computer Vision DFU
              </h3>
              <p className="text-teal-100 mb-6">
                Early detection of diabetic foot ulcers using advanced CNN technology. Screen foot images instantly for precise risk assessment.
              </p>
              <div className="text-center">
                <div className="text-4xl font-bold text-teal-200">👣</div>
              </div>
            </div>

            {/* IoT Smart Insole */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
              <div className="bg-gray-100 h-48 rounded-lg mb-6 flex items-center justify-center text-4xl">
                {/* Placeholder for insole image */}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                IoT Smart Insole
              </h3>
              <p className="text-gray-600">
                Real-time monitoring of foot pressure, temperature, and moisture. Detect anomalies early with wearable sensors for continuous protection.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Features Section */}
        <div className="grid lg:grid-cols-3 gap-8 pb-20">
          {/* Clinical Privacy */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clinical Privacy</h3>
            <p className="text-gray-600 text-sm">
              HIPAA-compliant encryption ensures your sensitive health data remains private and secure at all times.
            </p>
          </div>

          {/* Collaborative Care */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Collaborative Care</h3>
            <p className="text-gray-600 text-sm">
              Share results with healthcare providers for coordinated care and personalized treatment plans.
            </p>
          </div>

          {/* Smart Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Insights</h3>
            <p className="text-gray-600 text-sm">
              AI-powered recommendations tailored to your unique health profile and risk factors for actionable guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
