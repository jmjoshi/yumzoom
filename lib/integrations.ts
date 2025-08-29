import { Restaurant } from '@/types/restaurant';
import { generateSecureUrl } from './https-config';

// Calendar Integration Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  url?: string;
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Reservation System Types
export interface ReservationRequest {
  restaurantId: string;
  restaurantName: string;
  partySize: number;
  date: string;
  time: string;
  specialRequests?: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export interface ReservationResponse {
  success: boolean;
  reservationId?: string;
  confirmationNumber?: string;
  message: string;
  redirectUrl?: string;
}

export interface ReservationProvider {
  id: string;
  name: string;
  logo: string;
  supportsApi: boolean;
  websiteUrl: string;
}

// Food Delivery Integration Types
export interface DeliveryOption {
  provider: string;
  providerName: string;
  logo: string;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  isAvailable: boolean;
  deepLink: string;
}

export interface DeliveryProvider {
  id: string;
  name: string;
  logo: string;
  apiKey?: string;
  isActive: boolean;
}

// Social Media Sharing Types
export interface ShareContent {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  shareUrl: string;
  isEnabled: boolean;
}

// Integration Configuration
export const INTEGRATION_PROVIDERS = {
  calendar: [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      authUrl: 'https://accounts.google.com/oauth/authorize',
      scopes: ['https://www.googleapis.com/auth/calendar'],
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📅',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      scopes: ['https://graph.microsoft.com/calendars.readwrite'],
    },
  ],
  reservation: [
    {
      id: 'opentable',
      name: 'OpenTable',
      logo: '/images/opentable-logo.png',
      supportsApi: true,
      websiteUrl: 'https://www.opentable.com',
    },
    {
      id: 'resy',
      name: 'Resy',
      logo: '/images/resy-logo.png',
      supportsApi: false,
      websiteUrl: 'https://resy.com',
    },
    {
      id: 'yelp',
      name: 'Yelp Reservations',
      logo: '/images/yelp-logo.png',
      supportsApi: false,
      websiteUrl: 'https://www.yelp.com',
    },
  ],
  delivery: [
    {
      id: 'doordash',
      name: 'DoorDash',
      logo: '/images/doordash-logo.png',
      isActive: true,
    },
    {
      id: 'ubereats',
      name: 'Uber Eats',
      logo: '/images/ubereats-logo.png',
      isActive: true,
    },
    {
      id: 'grubhub',
      name: 'Grubhub',
      logo: '/images/grubhub-logo.png',
      isActive: true,
    },
    {
      id: 'postmates',
      name: 'Postmates',
      logo: '/images/postmates-logo.png',
      isActive: false, // Merged with Uber Eats
    },
  ],
  social: [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      shareUrl: 'https://www.facebook.com/sharer/sharer.php',
      isEnabled: true,
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      shareUrl: 'https://twitter.com/intent/tweet',
      isEnabled: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      shareUrl: '', // Instagram doesn't support direct sharing URLs
      isEnabled: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      shareUrl: 'https://wa.me/',
      isEnabled: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
      isEnabled: true,
    },
  ],
} as const;

// Utility Functions
export const generateCalendarEvent = (
  restaurant: Restaurant,
  date: Date,
  duration: number = 2
): CalendarEvent => {
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + duration);

  return {
    id: `yumzoom-${restaurant.id}-${date.getTime()}`,
    title: `Dinner at ${restaurant.name}`,
    description: `Dining reservation at ${restaurant.name}. Rated ${restaurant.rating || 'N/A'}/10 on YumZoom.`,
    start: date,
    end: endDate,
    location: restaurant.address || 'Restaurant location',
    url: generateSecureUrl(`/restaurants/${restaurant.id}`),
  };
};

export const generateShareContent = (
  restaurant: Restaurant,
  rating?: number,
  review?: string
): ShareContent => {
  const baseUrl = generateSecureUrl('');
  const restaurantUrl = generateSecureUrl(`/restaurants/${restaurant.id}`);
  
  let title = `Check out ${restaurant.name} on YumZoom!`;
  let description = `${restaurant.name} - ${restaurant.cuisine_type || 'Great'} cuisine`;
  
  if (rating) {
    title = `I rated ${restaurant.name} ${rating}/10 on YumZoom!`;
    description += `. I gave it ${rating}/10 stars.`;
  }
  
  if (review) {
    description += ` "${review.substring(0, 100)}${review.length > 100 ? '...' : ''}"`;
  }

  const cuisineTag = restaurant.cuisine_type?.replace(/\s+/g, '') || 'Restaurant';
  
  return {
    title,
    description,
    url: restaurantUrl,
    imageUrl: restaurant.image_url,
    hashtags: ['YumZoom', 'FoodReview', cuisineTag, 'DiningOut'],
  };
};

export const buildDeliveryDeepLink = (
  provider: string,
  restaurant: Restaurant
): string => {
  const restaurantName = encodeURIComponent(restaurant.name);
  const restaurantAddress = encodeURIComponent(restaurant.address || restaurant.name);
  
  switch (provider) {
    case 'doordash':
      return `https://www.doordash.com/store/${restaurantName.toLowerCase().replace(/\s+/g, '-')}/`;
    case 'ubereats':
      return `https://www.ubereats.com/search?q=${restaurantName}`;
    case 'grubhub':
      return `https://www.grubhub.com/search?searchMetro=&location=${restaurantAddress}&facet=restaurant:${restaurantName}`;
    default:
      return `https://www.google.com/search?q=${restaurantName}+${provider}+delivery`;
  }
};

export const formatShareUrl = (platform: string, content: ShareContent): string => {
  const { title, description, url, hashtags } = content;
  
  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    
    case 'twitter':
      const twitterText = `${title} ${hashtags?.map(tag => `#${tag}`).join(' ') || ''}`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(url)}`;
    
    case 'whatsapp':
      const whatsappText = `${title}\n${description}\n${url}`;
      return `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
    
    default:
      return url;
  }
};
