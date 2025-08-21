import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Mail, Phone, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import type { OwnerVerificationRequest } from '@/types/restaurant-owner';

interface RestaurantOption {
  id: string;
  name: string;
  address?: string;
}

interface OwnerVerificationFormProps {
  restaurants: RestaurantOption[];
  onSuccess?: () => void;
}

export default function OwnerVerificationForm({ restaurants, onSuccess }: OwnerVerificationFormProps) {
  const { submitVerificationRequest, ownerStatus, loading, error } = useRestaurantOwner();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<OwnerVerificationRequest>();

  const onSubmit = async (data: OwnerVerificationRequest) => {
    const success = await submitVerificationRequest(data);
    if (success) {
      setSuccessMessage('Verification request submitted successfully! We will review your request within 2-3 business days.');
      reset();
      onSuccess?.();
    }
  };

  const getVerificationStatus = (restaurantId: string) => {
    return ownerStatus.find(status => status.restaurant_id === restaurantId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Requested';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Owner Verification</h2>
        <p className="text-gray-600">
          Verify your ownership to respond to customer reviews and engage with your community.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <p className="text-sm text-green-700 mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Current Status */}
      {ownerStatus.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h3>
          <div className="space-y-3">
            {ownerStatus.map((status) => {
              const restaurant = restaurants.find(r => r.id === status.restaurant_id);
              return (
                <div key={status.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{restaurant?.name || 'Unknown Restaurant'}</h4>
                    <p className="text-sm text-gray-600">{status.business_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status.verification_status)}
                    <span className="text-sm font-medium">
                      {getStatusText(status.verification_status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Restaurant Selection */}
        <div>
          <label htmlFor="restaurant_id" className="block text-sm font-medium text-gray-700 mb-2">
            Restaurant *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              id="restaurant_id"
              {...register('restaurant_id', { required: 'Please select a restaurant' })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={isSubmitting || loading}
            >
              <option value="">Select a restaurant...</option>
              {restaurants.map((restaurant) => {
                const status = getVerificationStatus(restaurant.id);
                const isDisabled = status && (status.verification_status === 'verified' || status.verification_status === 'pending');
                
                return (
                  <option 
                    key={restaurant.id} 
                    value={restaurant.id}
                    disabled={isDisabled}
                  >
                    {restaurant.name} {isDisabled ? `(${getStatusText(status.verification_status)})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
          {errors.restaurant_id && (
            <p className="mt-1 text-sm text-red-600">{errors.restaurant_id.message}</p>
          )}
        </div>

        {/* Business Name */}
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="business_name"
              {...register('business_name', { 
                required: 'Business name is required',
                minLength: { value: 2, message: 'Business name must be at least 2 characters' }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your business name"
              disabled={isSubmitting || loading}
            />
          </div>
          {errors.business_name && (
            <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
          )}
        </div>

        {/* Business Email */}
        <div>
          <label htmlFor="business_email" className="block text-sm font-medium text-gray-700 mb-2">
            Business Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="business_email"
              {...register('business_email', { 
                required: 'Business email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your business email"
              disabled={isSubmitting || loading}
            />
          </div>
          {errors.business_email && (
            <p className="mt-1 text-sm text-red-600">{errors.business_email.message}</p>
          )}
        </div>

        {/* Business Phone */}
        <div>
          <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700 mb-2">
            Business Phone (Optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              id="business_phone"
              {...register('business_phone')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your business phone"
              disabled={isSubmitting || loading}
            />
          </div>
        </div>

        {/* Verification Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Verification Process</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• We will verify your ownership through business records and contact information</li>
            <li>• Verification typically takes 2-3 business days</li>
            <li>• Once verified, you can respond to customer reviews</li>
            <li>• You will receive email notifications when customers leave reviews</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || loading ? 'Submitting...' : 'Submit Verification Request'}
        </button>
      </form>
    </div>
  );
}
