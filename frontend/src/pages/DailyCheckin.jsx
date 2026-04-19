import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitDailyCheckin, getCheckinHistory, predictDiabetes } from '../services/api';
import { useUser } from '../contexts/UserContext';

export default function DailyCheckin() {
  const navigate = useNavigate();
  const { user, setLoading, setError } = useUser();
  const [currentDay, setCurrentDay] = useState(1);
  const [localLoading, setLocalLoading] = useState(false);
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
    day: 1,
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
      setCurrentDay(completedDays + 1);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      {/* Time Selection Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Preferred Checkin Time</h2>
            <p className="text-gray-600 mb-6">You can only submit your daily checkin once per day. Choose the time that works best for you:</p>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-6 text-lg"
            />
            <button
              onClick={() => {
                setShowTimeModal(false);
                localStorage.setItem(`checkin_time_${user.user_id}`, selectedTime);
              }}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Set Time & Continue
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              Day {checkinCount} Completed!
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Great job! Your assessment for day {checkinCount} has been saved.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-gray-700 font-semibold mb-2">⏰ Next Assessment Available:</p>
              <p className="text-2xl font-bold text-indigo-600 mb-4">{nextAvailableTime}</p>
              <p className="text-sm text-gray-600">
                You can submit your next daily assessment after this time.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-lg"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* 7-Day Complete Screen */}
        {submissionSuccess && checkinCount >= 7 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              All 7 Days Completed!
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Your assessment is complete. Generating your prediction...
            </p>
            <div className="flex justify-center mb-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        )}
        
        {isLocked && !submissionSuccess && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold">⏰ {lockMessage}</p>
          </div>
        )}

        {checkinCount >= 7 && !submissionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ All 7 days completed! Your prediction is ready.
          </div>
        )}

        {!submissionSuccess && checkinCount < 7 && !isLocked && (
          <form onSubmit={handleSubmit} className="space-y-6">
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
