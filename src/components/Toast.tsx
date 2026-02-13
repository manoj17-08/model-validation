import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border ${
        type === 'success'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      } animate-slide-in`}
    >
      <div className="flex-shrink-0">
        {type === 'success' ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            type === 'success' ? 'text-green-900' : 'text-red-900'
          }`}
        >
          {title}
        </p>
        <p
          className={`text-sm mt-1 ${
            type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
          type === 'success'
            ? 'hover:bg-green-100 text-green-600'
            : 'hover:bg-red-100 text-red-600'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
