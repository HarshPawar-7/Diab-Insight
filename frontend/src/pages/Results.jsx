import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPredictionHistory, getRecommendations } from '../services/api';
import { useUser } from '../contexts/UserContext';

export default function Results() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [restartLoading, setRestartLoading] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchData();
    } else {
      navigate('/register');
    }
  }, [user?.user_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const predResponse = await getPredictionHistory(user.user_id);
      const predictions = predResponse.data.predictions || [];
      setPredictions(predictions);

      if (predictions.length > 0) {
        setSelectedPrediction(predictions[0]);
        
        // Only fetch recommendations if we have predictions
        try {
          const recResponse = await getRecommendations(user.user_id);
          setRecommendations(recResponse.data || { nutrition_plan: [], lifestyle_goals: [] });
        } catch (recErr) {
          console.log('Could not fetch recommendations:', recErr.response?.data?.detail);
        }
      }
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch results';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 0.35) return 'green';
    if (score < 0.65) return 'yellow';
    return 'red';
  };

  const getRiskLabel = (score) => {
    if (score < 0.35) return 'Low Risk';
    if (score < 0.65) return 'Moderate Risk';
    return 'High Risk';
  };

  const handleRestartChallenge = async () => {
    try {
      setRestartLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/v1/test/clear-entries/${user.user_id}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        // Navigate to daily checkin which will show Day 1
        navigate('/daily-checkin');
      } else {
        alert('Failed to restart challenge');
      }
    } catch (err) {
      console.error('Error restarting challenge:', err);
      alert('Error restarting challenge');
    } finally {
      setRestartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8 lg:py-6 md:py-8 lg:py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/daily-checkin')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Complete Checkin
          </button>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8 lg:py-6 md:py-8 lg:py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">No Results Yet</h2>
          <p className="text-gray-600 mb-6">Complete 7 days of daily checkins to get your prediction</p>
          <button
            onClick={() => navigate('/daily-checkin')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Start Checkin
          </button>
        </div>
      </div>
    );
  }

  const pred = selectedPrediction;
  const riskColor = getRiskColor(pred.risk_score);
  const riskLabel = getRiskLabel(pred.risk_score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8 lg:py-6 md:py-8 lg:py-12 px-4">
      <div className="w-full max-w-7xl mx-auto px-4"><div className="grid lg:grid-cols-2 gap-4 sm:p-5 lg:p-6 items-start"><div>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Diabetes Risk Assessment</h1>
          <p className="text-gray-600">
            Assessment Date: {pred.predicted_at ? new Date(pred.predicted_at).toLocaleDateString() : (pred.created_at ? new Date(pred.created_at).toLocaleDateString() : 'Recent')}
          </p>
        </div>

        {/* Risk Score Card */}
        <div className={`bg-${riskColor}-50 border-2 border-${riskColor}-300 rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 mb-6`}>
          <div className="text-center">
            <p className={`text-${riskColor}-700 text-sm font-semibold mb-2 uppercase`}>Risk Level</p>
            <h2 className={`text-5xl font-bold text-${riskColor}-600 mb-2`}>
              {(pred.risk_score * 100).toFixed(1)}%
            </h2>
            <p className={`text-${riskColor}-700 text-xl font-semibold`}>{riskLabel}</p>
          </div>
          <div className="mt-6 w-full bg-gray-200 rounded-full h-4">
            <div
              className={`bg-${riskColor}-500 h-4 rounded-full`}
              style={{ width: `${pred.risk_score * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Prediction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Score:</span>
                <span className="font-semibold">{(pred.risk_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-semibold">{(pred.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Category:</span>
                <span className={`font-semibold text-${riskColor}-600`}>{pred.risk_category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Predicted Stage:</span>
                <span className="font-semibold">{pred.predicted_stage || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What This Means</h3>
            <p className="text-gray-700">
              {riskLabel === 'Low Risk'
                ? 'Your diabetes risk is relatively low. Continue maintaining healthy lifestyle habits.'
                : riskLabel === 'Moderate Risk'
                ? 'You have a moderate risk of diabetes. Consider implementing the recommended lifestyle changes.'
                : 'Your diabetes risk is high. Consult with a healthcare provider and follow the recommendations closely.'}
            </p>
          </div>
        </div>

        </div>

        {/* Column 2: Phase 2 Recommendations */}
        <div className="flex flex-col gap-4 md:gap-4 md:gap-6">
        {recommendations && (recommendations.nutrition_plan?.length > 0 || recommendations.lifestyle_goals?.length > 0) && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Personalized Nutrition & Lifestyle Plan</h3>
            
            {recommendations.nutrition_plan?.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-green-700 mb-4">🥗 Recommended Foods</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.nutrition_plan.map((item, index) => (
                    <div key={index} className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                      <h5 className="font-bold text-gray-900 text-lg">{item.food}</h5>
                      <p className="text-gray-700 text-sm mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.lifestyle_goals?.length > 0 && (
              <div>
                <h4 className="text-xl font-semibold text-blue-700 mb-4">🏃‍♂️ Lifestyle Goals</h4>
                <ul className="space-y-3">
                  {recommendations.lifestyle_goals.map((goal, index) => (
                    <li key={index} className="flex items-start bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                      <span className="text-blue-600 mr-3 text-lg">✦</span>
                      <span className="text-gray-800">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons underneath phase 2 or combined */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-wrap w-full mt-auto">
          <button
            onClick={handleRestartChallenge}
            disabled={restartLoading}
            className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400"
          >
            {restartLoading ? 'Restarting...' : '🔄 Restart 7-Day Challenge'}
          </button>
          <button
            onClick={() => navigate('/daily-checkin')}
            className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Update Checkin
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            Back Home
          </button>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
