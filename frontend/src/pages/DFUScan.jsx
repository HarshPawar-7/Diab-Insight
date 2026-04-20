import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { uploadDFUScan, getDFUScanHistory } from '../services/api';

export default function DFUScan() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('❌ Invalid file format. Please upload JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('❌ File is too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !user?.user_id) {
      setError('❌ Please select an image and ensure you are logged in.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadDFUScan(user.user_id, selectedFile);
      setScanResult(response.data);
      setScanComplete(true);
    } catch (err) {
      console.error('DFU scan error:', err);
      
      // Handle specific error codes
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      
      let errorMessage = '❌ Scan failed. Please try again.';
      
      if (status === 400) {
        if (detail?.includes('API Configuration')) {
          errorMessage = `⚠️ ${detail}`;
        } else {
          errorMessage = `❌ Invalid request: ${detail || 'Bad file format or size'}`;
        }
      } else if (status === 401) {
        errorMessage = '❌ Authentication failed. Please log in again.';
      } else if (status === 413) {
        errorMessage = '❌ File too large. Max size is 10MB.';
      } else if (status === 422) {
        // Unprocessable Entity - diagnosis failed
        if (detail?.includes('API key')) {
          errorMessage = '❌ API Configuration Error: Invalid or expired API key. Please contact support.';
        } else if (detail?.includes('quota')) {
          errorMessage = '❌ Rate limit exceeded. Please wait a moment and try again.';
        } else {
          errorMessage = `❌ Diagnosis failed: ${detail || 'Unable to analyze image'}`;
        }
      } else if (status === 429) {
        errorMessage = '⏱️ Rate limit exceeded. Please wait 1 minute and try again.';
      } else if (status === 500) {
        errorMessage = '❌ Server error. Please try again later.';
      } else {
        errorMessage = detail || '❌ Scan failed. Please try again or contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Handle retake
  const handleRetake = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setScanComplete(false);
    setScanResult(null);
    setError(null);
    fileInputRef.current?.click();
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Get color for prediction badge
  const getPredictionColor = (label) => {
    switch (label) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'early_dfu':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced_dfu':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get icon for prediction
  const getPredictionIcon = (label) => {
    switch (label) {
      case 'healthy':
        return '✅';
      case 'early_dfu':
        return '⚠️';
      case 'advanced_dfu':
        return '🔴';
      default:
        return '📋';
    }
  };

  // UPLOAD VIEW - File selection and upload
  if (!scanComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-100 rounded-full p-4 mb-4">
              <span className="text-4xl">🦶</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Diabetic Foot Ulcer Detection
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              Upload a clear photo of your foot for AI-powered DFU detection.
              Early detection can prevent serious complications.
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📸 Capture Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use good lighting (natural light preferred)</li>
                <li>• Ensure entire foot is visible in frame</li>
                <li>• Take clear, non-blurry photos</li>
                <li>• JPG, PNG, or WebP format (max 10MB)</li>
              </ul>
            </div>

            {/* File Input */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {imagePreview ? (
                // Image Preview
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-2xl overflow-hidden border-2 border-indigo-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-semibold">{selectedFile.name}</span>
                      {' '}
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm underline"
                    >
                      Choose different image
                    </button>
                  </div>
                </div>
              ) : (
                // Upload Area
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center cursor-pointer hover:bg-indigo-50 transition"
                >
                  <div className="text-5xl mb-4">📁</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-600">
                    JPG, PNG, or WebP (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                  uploading || !selectedFile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {uploading ? (
                  <>
                    <span className="inline-block mr-2">⏳</span>
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <span className="inline-block mr-2">📤</span>
                    Start Scan
                  </>
                )}
              </button>
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">⚠️ Medical Disclaimer:</span>
              {' '}
              This AI tool is for educational purposes only and should not replace
              professional medical diagnosis. Always consult a healthcare provider.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS VIEW - Display scan results
  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Scan Results
            </h1>
            <p className="text-gray-600">
              Analysis completed at{' '}
              {new Date(scanResult.scanned_at).toLocaleString()}
            </p>
          </div>

          {/* Main Results Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            {/* Prediction */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Prediction Result
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div
                    className={`inline-block px-6 py-3 rounded-full border-2 font-bold text-lg ${getPredictionColor(
                      scanResult.prediction_label
                    )}`}
                  >
                    <span className="mr-2">
                      {getPredictionIcon(scanResult.prediction_label)}
                    </span>
                    {scanResult.prediction_label
                      .replace(/_/g, ' ')
                      .toUpperCase()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Confidence</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {(scanResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  Model Confidence
                </p>
                <p className="text-xs text-gray-500">
                  {(scanResult.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${scanResult.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Clinical Assessment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg mb-6">
              {scanResult.severity_score !== undefined && scanResult.severity_score !== null && (
                <div>
                  <p className="text-xs text-indigo-800 uppercase tracking-wide font-bold mb-1">
                    Severity Score
                  </p>
                  <p className="font-bold text-gray-900 flex items-center">
                    {(scanResult.severity_score * 10).toFixed(1)} / 10
                  </p>
                </div>
              )}
              {scanResult.wagner_class !== undefined && scanResult.wagner_class !== null && scanResult.wagner_class !== 'N/A' && (
                <div>
                  <p className="text-xs text-indigo-800 uppercase tracking-wide font-bold mb-1">
                    Wagner Scale Class
                  </p>
                  <p className="font-bold text-gray-900">
                    Class {scanResult.wagner_class}
                  </p>
                </div>
              )}
              {scanResult.clinical_assessment && scanResult.clinical_assessment !== 'N/A' && (
                <div className="md:col-span-2 mt-2 pt-2 border-t border-indigo-200">
                  <p className="text-xs text-indigo-800 uppercase tracking-wide font-bold mb-2">
                    Clinical Findings
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed italic border-l-4 border-indigo-400 pl-3">
                    "{scanResult.clinical_assessment}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Recommendations */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📋 Recommended Next Steps
            </h2>
            <div className="space-y-3">
              {scanResult.next_steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400"
                >
                  <span className="font-semibold text-indigo-600 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <p className="text-gray-800">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notice */}
          {scanResult.prediction_label !== 'healthy' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-red-900 mb-2">
                ⚠️ Important Notice
              </h3>
              <p className="text-red-800 text-sm">
                Abnormalities detected. This is NOT a medical diagnosis. Please
                consult with a healthcare professional immediately for proper
                evaluation and treatment.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleRetake}
              className="py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span>📸</span> Scan Again
            </button>
            <button
              onClick={handleBackToDashboard}
              className="py-3 rounded-xl font-semibold text-gray-900 bg-gray-200 hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
