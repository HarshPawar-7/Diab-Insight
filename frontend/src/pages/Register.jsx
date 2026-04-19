import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useUser } from '../contexts/UserContext';

export default function Register() {
  const navigate = useNavigate();
  const { setUser, setError } = useUser();
  const [step, setStep] = useState(1); // Step 1: Basic Info, Step 2: Demographics
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    ethnicity: '',
    bmi: '',
    alcohol_consumption_per_week: 0,
    education_level: '',
    income_level: '',
    employment_status: '',
    smoking_status: 'Never',
    family_history_diabetes: false,
    hypertension_history: false,
    cardiovascular_history: false,
  });
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setLocalError('');

    // Validate step 1
    if (!formData.name || !formData.email || !formData.password) {
      setLocalError('Please fill in all required fields');
      return;
    }
    if (formData.name.length < 2) {
      setLocalError('Name must be at least 2 characters');
      return;
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLocalLoading(true);

    try {
      // Validate step 2
      if (!formData.age || !formData.gender || !formData.ethnicity || !formData.bmi || !formData.employment_status) {
        throw new Error('Please fill in all required fields');
      }

      const response = await registerUser(formData);
      const userData = response.data;

      // Store user data in context and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('user_id', userData.user_id);
      localStorage.setItem('email', userData.email);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      let message = err.response?.data?.detail || err.message || 'Registration failed';
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        message = `This email is already registered. Please log in or use a different email.`;
        // Reset to step 1 so user can change email
        setStep(1);
      }
      
      setLocalError(message);
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setLocalError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">
            {step === 1
              ? "Let's start with your basic information"
              : "Now tell us about your health and background"}
          </p>
          {/* Progress indicator */}
          <div className="mt-4 flex gap-2">
            <div
              className={`flex-1 h-1 rounded-full transition-colors ${
                step >= 1 ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            ></div>
            <div
              className={`flex-1 h-1 rounded-full transition-colors ${
                step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            ></div>
          </div>
        </div>

        {localError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {localError}
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">We'll never share your email</p>
            </div>

            {/* Password with Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pr-10"
                  placeholder="Min 6 characters"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.394 17.394a3 3 0 00-4.243-4.243m3.536 0a3 3 0 01-4.242-4.242m9.546-1.055a9.003 9.003 0 01-9.548 7m6.7-3.97a.75.75 0 00-1.152-.082A9.001 9.001 0 005.378 5.78.75.75 0 006.632 4.62a10.5 10.5 0 0114.971 3.072 2.25 2.25 0 002.583 2.583z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
            </div>

            {/* Next Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Continue to Next Step
              </button>
            </div>

            {/* Login Link */}
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Login here
              </Link>
            </p>
          </form>
        )}

        {/* STEP 2: Demographics */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                min="18"
                max="120"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Ethnicity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ethnicity <span className="text-red-500">*</span>
              </label>
              <select
                name="ethnicity"
                value={formData.ethnicity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select ethnicity</option>
                <option value="Caucasian">Caucasian</option>
                <option value="African">African</option>
                <option value="Asian">Asian</option>
                <option value="Hispanic">Hispanic</option>
                <option value="Middle Eastern">Middle Eastern</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* BMI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Mass Index (BMI) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bmi"
                min="10"
                max="60"
                step="0.1"
                value={formData.bmi}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g., 25.5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Weight (kg) / Height (m)²</p>
            </div>

            {/* Alcohol Consumption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alcohol Consumption (glasses per week)
              </label>
              <input
                type="number"
                name="alcohol_consumption_per_week"
                min="0"
                max="50"
                value={formData.alcohol_consumption_per_week}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select education level</option>
                <option value="High School">High School</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            {/* Income Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Income Level
              </label>
              <select
                name="income_level"
                value={formData.income_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select income level</option>
                <option value="Low">Low (&lt;$25k)</option>
                <option value="Middle">Middle ($25k-$75k)</option>
                <option value="High">High (&gt;$75k)</option>
              </select>
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Status <span className="text-red-500">*</span>
              </label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select employment status</option>
                <option value="Employed">Employed</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Student">Student</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            {/* Smoking Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smoking Status
              </label>
              <select
                name="smoking_status"
                value={formData.smoking_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="Never">Never Smoked</option>
                <option value="Former">Former Smoker</option>
                <option value="Current">Current Smoker</option>
              </select>
            </div>

            {/* Medical History Checkboxes */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Medical History (optional)</p>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="family_history_diabetes"
                  checked={formData.family_history_diabetes}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Family history of diabetes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hypertension_history"
                  checked={formData.hypertension_history}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  History of hypertension
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="cardiovascular_history"
                  checked={formData.cardiovascular_history}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  History of cardiovascular disease
                </label>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={localLoading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {localLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
