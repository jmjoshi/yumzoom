import { useState, useEffect } from 'react';
import { X, Star, User, Send } from 'lucide-react';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (responseText: string) => Promise<void>;
  review: any;
  existingResponse?: string;
  isEditing?: boolean;
}

export default function ResponseModal({
  isOpen,
  onClose,
  onSubmit,
  review,
  existingResponse,
  isEditing = false
}: ResponseModalProps) {
  const [responseText, setResponseText] = useState(existingResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const maxChars = 1000;

  useEffect(() => {
    setResponseText(existingResponse || '');
  }, [existingResponse]);

  useEffect(() => {
    setCharCount(responseText.length);
  }, [responseText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!responseText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(responseText.trim());
      setResponseText('');
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Response' : 'Respond to Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Review Content */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">{review.user_name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">{formatDate(review.created_at)}</span>
              </div>
              
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{review.rating}/10</span>
              </div>

              {review.review_text && (
                <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
              )}
            </div>
          </div>
        </div>

        {/* Response Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              id="response"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={6}
              maxLength={maxChars}
              placeholder="Thank you for your feedback! We appreciate you taking the time to share your experience..."
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Be professional, appreciative, and address any specific concerns mentioned.
              </p>
              <span className={`text-xs ${charCount > maxChars * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Response Guidelines */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Response Guidelines</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Thank the customer for their feedback</li>
              <li>• Address specific concerns or compliments mentioned</li>
              <li>• Keep responses professional and courteous</li>
              <li>• Invite them to visit again or contact you directly</li>
              <li>• Avoid defensive language or arguments</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!responseText.trim() || isSubmitting || charCount > maxChars}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Sending...') 
                  : (isEditing ? 'Update Response' : 'Send Response')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
