import { useState } from 'react';
import { FileText, Image, Video, Link } from 'lucide-react';
import ValidationCard from './components/ValidationCard';
import ToastContainer from './components/ToastContainer';
import { ToastProps } from './components/Toast';
import {
  validateText,
  validateImage,
  validateVideo,
  validateURL,
  ValidationResult,
} from './services/validationService';

function App() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (
    type: 'success' | 'error',
    title: string,
    message: string
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleValidationResult = (result: ValidationResult) => {
    if (result.result === 'authentic') {
      addToast(
        'success',
        'Authenticated',
        `Data verified with ${result.confidence_score.toFixed(0)}% confidence`
      );
    } else {
      addToast(
        'error',
        'Not Authenticated',
        `Potential fake detected with ${result.confidence_score.toFixed(0)}% confidence`
      );
    }
  };

  const handleValidationError = (error: string) => {
    addToast('error', 'Validation Error', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multi-Modal Authentication System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Validate the authenticity of text, images, videos, and URLs using
            advanced ML-powered analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <ValidationCard
            icon={<FileText className="w-6 h-6" />}
            title="Text Validation"
            placeholder="Enter text to validate..."
            inputType="textarea"
            onValidate={validateText}
            onResult={handleValidationResult}
            onError={handleValidationError}
          />

          <ValidationCard
            icon={<Image className="w-6 h-6" />}
            title="Image Validation"
            placeholder="Enter image URL..."
            onValidate={validateImage}
            onResult={handleValidationResult}
            onError={handleValidationError}
          />

          <ValidationCard
            icon={<Video className="w-6 h-6" />}
            title="Video Validation"
            placeholder="Enter video URL..."
            onValidate={validateVideo}
            onResult={handleValidationResult}
            onError={handleValidationError}
          />

          <ValidationCard
            icon={<Link className="w-6 h-6" />}
            title="URL Validation"
            placeholder="Enter URL to check..."
            onValidate={validateURL}
            onResult={handleValidationResult}
            onError={handleValidationError}
          />
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              System Status
            </h3>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">
                All validation endpoints active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
