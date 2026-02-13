import { useState } from 'react';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { ValidationResult } from '../services/validationService';

interface ValidationCardProps {
  icon: React.ReactNode;
  title: string;
  placeholder: string;
  inputType?: 'text' | 'textarea';
  onValidate: (input: string) => Promise<ValidationResult>;
  onResult: (result: ValidationResult) => void;
  onError: (error: string) => void;
}

export default function ValidationCard({
  icon,
  title,
  placeholder,
  inputType = 'text',
  onValidate,
  onResult,
  onError,
}: ValidationCardProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!input.trim()) {
      onError('Please enter a value to validate');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const validationResult = await onValidate(input);
      setResult(validationResult);
      onResult(validationResult);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="space-y-4">
        {inputType === 'textarea' ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            rows={4}
          />
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        )}

        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Validate
            </>
          )}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg border-2 ${
              result.result === 'authentic'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {result.result === 'authentic' ? (
                  <Shield className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-1 ${
                    result.result === 'authentic'
                      ? 'text-green-900'
                      : 'text-red-900'
                  }`}
                >
                  {result.result === 'authentic' ? 'Authenticated' : 'Not Authenticated'}
                </h3>
                <p
                  className={`text-sm mb-2 ${
                    result.result === 'authentic'
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  {result.details.message}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    Confidence Score:
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        result.result === 'authentic'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {result.confidence_score.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
