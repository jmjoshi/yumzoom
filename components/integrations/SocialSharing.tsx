'use client';

import React, { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant';
import { Share2, Copy, CheckCircle, ExternalLink, Hash, Image } from 'lucide-react';

interface SocialSharingProps {
  restaurant: Restaurant;
  rating?: number;
  review?: string;
  onShare?: (platform: string) => void;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  supportsDirectSharing: boolean;
  instructions: string;
}

interface ShareContent {
  text: string;
  hashtags?: string[];
  imageUrl?: string;
}

export function SocialSharing({ restaurant, rating, review, onShare }: SocialSharingProps) {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    loadSocialPlatforms();
  }, []);

  const loadSocialPlatforms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/social');
      const data = await response.json();
      
      if (data.success) {
        setPlatforms(data.platforms);
      }
    } catch (error) {
      console.error('Error loading social platforms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (platform: string) => {
    try {
      const response = await fetch('/api/integrations/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          platform,
          rating,
          review,
          customMessage: customMessage || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.shareMethod === 'url') {
          // Direct sharing via URL
          window.open(data.shareUrl, '_blank', 'width=600,height=400,scrollbars=yes');
        } else if (data.shareMethod === 'copy') {
          // Copy content for manual sharing (Instagram)
          setShareContent(data.content);
          setSelectedPlatform(platform);
        }
        
        onShare?.(platform);
      } else {
        alert('Failed to prepare share content. Please try again.');
      }
    } catch (error) {
      console.error('Sharing error:', error);
      alert('Error preparing share content.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const generateDefaultMessage = () => {
    if (rating && review) {
      return `Just rated ${restaurant.name} ${rating}/10 on YumZoom! ${review.substring(0, 100)}${review.length > 100 ? '...' : ''}`;
    } else if (rating) {
      return `Just rated ${restaurant.name} ${rating}/10 on YumZoom! Great ${restaurant.cuisine_type} food in ${restaurant.city}.`;
    } else {
      return `Check out ${restaurant.name} on YumZoom! Great ${restaurant.cuisine_type} restaurant in ${restaurant.city}.`;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold">Share Your Experience</h3>
        </div>
        <p className="text-gray-600">Loading sharing options...</p>
      </div>
    );
  }

  // Instagram copy mode
  if (selectedPlatform === 'instagram' && shareContent) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold">Share on Instagram</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">Copy this text:</span>
            </div>
            
            <div className="bg-white p-3 rounded border text-sm">
              {shareContent.text}
            </div>
            
            <button
              onClick={() => copyToClipboard(shareContent.text)}
              className={`mt-2 flex items-center gap-2 px-3 py-1 rounded text-sm ${
                copiedText 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {copiedText ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Text
                </>
              )}
            </button>
          </div>

          {shareContent.hashtags && shareContent.hashtags.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Suggested hashtags:</span>
              </div>
              
              <div className="bg-white p-3 rounded border text-sm">
                {shareContent.hashtags.map(tag => `#${tag}`).join(' ')}
              </div>
              
              <button
                onClick={() => copyToClipboard(shareContent.hashtags!.map(tag => `#${tag}`).join(' '))}
                className="mt-2 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Copy className="h-4 w-4" />
                Copy Hashtags
              </button>
            </div>
          )}

          {shareContent.imageUrl && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Image className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Use this image:</span>
              </div>
              <img 
                src={shareContent.imageUrl} 
                alt={restaurant.name}
                className="w-full max-w-xs rounded border"
              />
            </div>
          )}

          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
            <strong>Instructions:</strong> Copy the text and hashtags above, then open Instagram and create a new post. 
            Paste the content and add a photo of your meal or the restaurant.
          </div>

          <button
            onClick={() => {
              setSelectedPlatform(null);
              setShareContent(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Sharing Options
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Share2 className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold">Share Your Experience</h3>
      </div>

      <div className="space-y-4">
        {/* Custom message input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom message (optional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={generateDefaultMessage()}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use our suggested message
          </p>
        </div>

        {/* Share buttons */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Choose a platform:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform.id)}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <span className="text-2xl">{platform.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{platform.name}</div>
                  {platform.id === 'instagram' && (
                    <div className="text-xs text-gray-500">Copy & paste</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
          <div className="text-sm text-gray-700">
            <p className="mb-2">
              <strong>{restaurant.name}</strong> - {restaurant.cuisine_type} in {restaurant.city}
            </p>
            {rating && (
              <p className="mb-2">⭐ Rating: {rating}/10</p>
            )}
            {review && (
              <p className="mb-2 italic">"{review.substring(0, 150)}{review.length > 150 ? '...' : ''}"</p>
            )}
            <p className="text-purple-600">
              {customMessage || generateDefaultMessage()}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Sharing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tag the restaurant's social media accounts for better engagement</li>
            <li>• Include photos of your favorite dishes to make your post more appealing</li>
            <li>• Share specific menu recommendations based on your YumZoom ratings</li>
            <li>• Consider mentioning if it's family-friendly or good for special occasions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
