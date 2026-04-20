import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitDailyCheckin, getCheckinHistory, predictDiabetes } from '../services/api';
import { useUser } from '../contexts/UserContext';

export default function DailyCheckin() {
  const navigate = useNavigate();
  const { user, setLoading, setError } = useUser();
  const [currentDay, setCurrentDay] = useState(1);
  const [localLoading, setLocalLoading] = useState(true); // Start as true to show loading
  const [localError, setLocalError] = useState('');
  const [checkinCount, setCheckinCount] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState(null);

  const [formData, setFormData] = useState({
    user_id: user?.user_id || '',
    diet_score: 5,
    physical_activity_minutes: 30,
    sleep_hours: 7,
    screen_time_hours: 4,
    hydration_glasses: 8,
    stress_level: 3,
  });

  // Check existing checkins on mount
  useEffect(() => {
    if (user?.user_id) {
      fetchCheckinHistory();
    }
  }, [user?.user_id]);

  const fetchCheckinHistory = async () => {
    try {
      const response = await getCheckinHistory(user.user_id);
      const completedDays = response.data.days_completed || 0;
      const preferredTime = response.data.preferred_checkin_time;
      const isAlreadyCompletedToday = response.data.already_completed_today || false;
      
      setCheckinCount(completedDays);
      setCurrentDay(completedDays + 1); // This will trigger the second useEffect to update formData
      
      // Show time selection modal only on first checkin
      if (completedDays === 0) {
        setShowTimeModal(true);
      }
      
      // Check if already completed in last 24 hours
      if (isAlreadyCompletedToday && completedDays < 7) {
        setIsLocked(true);
        // Calculate when they can submit next (24 hours from last entry)
        const lastEntry = response.data.entries && response.data.entries[0];
        if (lastEntry) {
          const lastEntryTime = new Date(lastEntry.date);
          const nextAvailableTime = new Date(lastEntryTime.getTime() + 24 * 60 * 60 * 1000);
          const timeString = nextAvailableTime.toLocaleString();
          setLockMessage(`You've already completed today's assessment. You can submit your next assessment on ${timeString}`);
        } else {
          setLockMessage(`You've already completed today's assessment. Come back in 24 hours.`);
        }
      }
    } catch (err) {
      // Silent fail - checkin history might not exist yet
      console.log('History fetch error:', err);
    } finally {
      setLocalLoading(false); // Stop loading after fetch completes
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert to appropriate type based on field
    let convertedValue = value;
    if (['physical_activity_minutes', 'hydration_glasses', 'stress_level'].includes(name)) {
      convertedValue = parseInt(value);
    } else {
      convertedValue = parseFloat(value);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: convertedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLocalLoading(true);

    try {
      const payload = {
        user_id: user.user_id,
        day: currentDay,
        diet_score: formData.diet_score,
        physical_activity_minutes: formData.physical_activity_minutes,
        sleep_hours: formData.sleep_hours,
        screen_time_hours: formData.screen_time_hours,
        hydration_glasses: formData.hydration_glasses,
        stress_level: formData.stress_level,
      };
      
      // Add preferred time on first submission
      if (checkinCount === 0) {
        payload.preferred_checkin_time = selectedTime;
      }
      
      await submitDailyCheckin(payload);

      const newCount = checkinCount + 1;
      setCheckinCount(newCount);
      
      // Calculate next available time (24 hours from now)
      const now = new Date();
      const nextTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setNextAvailableTime(nextTime.toLocaleString());
      setSubmissionSuccess(true);

      // If 7 days completed, auto-redirect to results after 3 seconds
      if (newCount >= 7) {
        setTimeout(() => {
          makePrediction();
        }, 2000);
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.error || err.message || 'Checkin failed';
      setLocalError(message);
      
      // If error mentions time remaining, lock the form
      if (message.includes('can submit your next assessment')) {
        setIsLocked(true);
        setLockMessage(message);
      }
      
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const makePrediction = async () => {
    try {
      setLocalLoading(true);
      await predictDiabetes(user.user_id);
      navigate('/results');
    } catch (err) {
      const message = err.response?.data?.detail || 'Prediction failed';
      setLocalError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please register first</h2>
          <button
            onClick={() => navigate('/register')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Go to Register
          </button>
        </div>
      </div>
    );
  }

  // Show loading while fetching checkin history
  if (localLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Loading assessment...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8 lg:py-6 md:py-8 lg:py-12 px-4">
      {/* Time Selection Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-5 lg:p-6 max-w-md w-full border border-gray-100 drop-shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-4 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 9.414V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Set Your Daily Time</h2>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              Choose when you'd like to complete your daily health checkin. You can only submit once per 24 hours.
            </p>

            {/* Time Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-semibold text-center bg-gray-50 hover:bg-white transition"
              />
            </div>

            {/* Continue Button */}
            <button
              onClick={() => {
                setShowTimeModal(false);
                localStorage.setItem(`checkin_time_${user.user_id}`, selectedTime);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              Set Time & Continue →
            </button>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-lg lg:max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-5 lg:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Health Checkin</h1>
            <p className="text-gray-600">Day {currentDay} of 7 - Track your daily habits</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(checkinCount / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        {localError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div>{localError}</div>
          </div>
        )}

        {/* Submission Success Screen */}
        {submissionSuccess && checkinCount < 7 && (
          <div className="text-center py-8">
            {/* Top Image */}
            <div className="mb-6 rounded-2xl overflow-hidden bg-gray-200 h-32 flex items-center justify-center">
              <div className="text-5xl">💼</div>
            </div>

            {/* Checkmark Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-9 h-9 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Day {checkinCount} Completed!
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-sm mb-6">
              Excellent start to your 7-day journey. We've recorded your initial biometrics and behavioral data.
            </p>

            {/* Next Session Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-700">NEXT SESSION</p>
              </div>
              <p className="text-base font-bold text-blue-600">
                Visit again in 24 hours at {nextAvailableTime}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-base flex items-center gap-2 mx-auto"
            >
              Redirect to Dashboard →
            </button>
          </div>
        )}

        {/* 7-Day Complete Screen */}
        {submissionSuccess && checkinCount >= 7 && (
          <div className="text-center py-8">
            {/* Top Image */}
            <div className="mb-6 rounded-2xl overflow-hidden bg-gray-200 h-32 flex items-center justify-center">
              <div className="text-5xl">🎊</div>
            </div>

            {/* Checkmark Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-9 h-9 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              All 7 Days Completed!
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-sm mb-6">
              Congratulations! Your assessment is complete. We're analyzing your data and generating your personalized prediction...
            </p>

            {/* Loading Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          </div>
        )}
        
        {isLocked && !submissionSuccess && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-yellow-900">{lockMessage}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {checkinCount >= 7 && !submissionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ All 7 days completed! Your prediction is ready.
          </div>
        )}

        {!submissionSuccess && checkinCount < 7 && !isLocked && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Diet Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Score (1-10): {formData.diet_score}
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
              <p className="text-sm text-gray-500 mt-1">How healthy was your diet today?</p>
            </div>

            {/* Physical Activity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Physical Activity (minutes)
              </label>
              <input
                type="number"
                name="physical_activity_minutes"
                min="0"
                max="480"
                value={formData.physical_activity_minutes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep Hours (2-12)
              </label>
              <input
                type="number"
                name="sleep_hours"
                min="2"
                max="12"
                step="0.5"
                value={formData.sleep_hours}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Screen Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screen Time (hours)
              </label>
              <input
                type="number"
                name="screen_time_hours"
                min="0"
                max="24"
                step="0.5"
                value={formData.screen_time_hours}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Hydration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Water Intake (glasses)
              </label>
              <input
                type="number"
                name="hydration_glasses"
                min="0"
                max="20"
                value={formData.hydration_glasses}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stress Level (1-5): {formData.stress_level}
              </label>
              <input
                type="range"
                name="stress_level"
                min="1"
                max="5"
                value={formData.stress_level}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                disabled={localLoading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50"
              >
                {localLoading ? 'Saving...' : `Save Day ${currentDay}`}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Dashboard
              </button>
            </div>
          </form>
        )}

        {!submissionSuccess && checkinCount >= 7 && !isLocked && (
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/results')}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              View Results
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Back Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
