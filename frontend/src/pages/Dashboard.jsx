import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { getCheckinHistory } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchCheckinProgress();
  }, [user, navigate]);

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

  const handleStartAssessment = () => {
    navigate('/daily-checkin');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      {/* Navigation */}
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-600">DiabInsight</h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600 text-lg">
            Track your health daily and get personalized diabetes risk predictions.
          </p>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">7-Day Assessment Progress</h3>
          
          {loading ? (
            <p className="text-gray-600">Loading progress...</p>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">
                    {daysCompleted} of 7 days completed
                  </span>
                  <span className="text-sm text-gray-500">
                    {daysCompleted === 7 ? '✓ Complete!' : `${7 - daysCompleted} remaining`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(daysCompleted / 7) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Message */}
              {daysCompleted === 0 && (
                <p className="text-blue-600 font-medium mb-4">
                  👋 Start your 7-day health assessment to get a diabetes risk prediction!
                </p>
              )}
              
              {daysCompleted > 0 && daysCompleted < 7 && (
                <p className="text-blue-600 font-medium mb-4">
                  ✅ Great progress! Complete {7 - daysCompleted} more days to generate your prediction.
                </p>
              )}
              
              {daysCompleted === 7 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-semibold">
                    🎉 Assessment complete! Your prediction is ready.
                  </p>
                  <button
                    onClick={() => navigate('/results')}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    View Results
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-2">📋</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Daily Assessment</h4>
            <p className="text-gray-600 text-sm">
              Fill out your daily health checklist to track your progress.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-2">🎯</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Risk Prediction</h4>
            <p className="text-gray-600 text-sm">
              Get your personalized diabetes risk score after 7 days.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-2">💡</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h4>
            <p className="text-gray-600 text-sm">
              Receive personalized health recommendations based on results.
            </p>
          </div>
        </div>

        {/* Start Assessment Button */}
        {daysCompleted < 7 && (
          <div className="flex gap-4">
            <button
              onClick={handleStartAssessment}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition font-bold text-lg"
            >
              {daysCompleted === 0 ? '🚀 Start 7-Day Assessment' : '📝 Continue Assessment'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
