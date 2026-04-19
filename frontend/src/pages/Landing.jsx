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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">DiabInsight</h1>
            </div>
            {!user && (
              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition font-medium"
                >
                  Login
                </Link>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Diabetes Risk Assessment Made Simple
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get personalized diabetes predictions and health recommendations in minutes.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition text-lg font-semibold"
          >
            Start Free Assessment
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Risk Prediction</h3>
            <p className="text-gray-600">
              Get accurate diabetes risk scores based on your lifestyle and medical history.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
            <p className="text-gray-600">
              Receive tailored health and lifestyle recommendations based on your risk level.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Privacy Protected</h3>
            <p className="text-gray-600">
              Your health data is secure, encrypted, and never shared with third parties.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Register</h4>
              <p className="text-gray-600 text-sm">Create an account with your basic information</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Complete Checkin</h4>
              <p className="text-gray-600 text-sm">Answer 7 days of health questionnaire</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Get Results</h4>
              <p className="text-gray-600 text-sm">View your personalized risk assessment</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Take Action</h4>
              <p className="text-gray-600 text-sm">Follow recommendations to improve health</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
