// Example: Integrating Feature Flags into Existing Components

import React from 'react';
import { FeatureFlag } from '@/components/feature-flags/FeatureFlag';
import { useFeatureFlag, useFeatureFlags } from '@/hooks/useFeatureFlags';

// Example 1: Simple feature gating
export function RestaurantCard({ restaurant }) {
  return (
    <div className="restaurant-card">
      <h3>{restaurant.name}</h3>
      <p>{restaurant.description}</p>

      {/* Social features - only show if enabled */}
      <FeatureFlag
        feature="social_features"
        fallback={
          <p className="text-muted">Social features coming soon!</p>
        }
      >
        <SocialFeatures restaurantId={restaurant.id} />
      </FeatureFlag>

      {/* Gamification - show badges if enabled */}
      <FeatureFlag feature="gamification">
        <RestaurantBadges restaurantId={restaurant.id} />
      </FeatureFlag>
    </div>
  );
}

// Example 2: Conditional rendering with hooks
export function AnalyticsDashboard() {
  const { enabled: advancedAnalytics } = useFeatureFlag('advanced_analytics');
  const { enabled: basicAnalytics } = useFeatureFlag('basic_analytics');

  if (advancedAnalytics) {
    return <AdvancedAnalyticsDashboard />;
  }

  if (basicAnalytics) {
    return <BasicAnalyticsDashboard />;
  }

  return <NoAnalyticsMessage />;
}

// Example 3: Multiple features with single hook
export function UserDashboard() {
  const { features, loading } = useFeatureFlags([
    'social_features',
    'gamification',
    'business_platform',
    'future_tech'
  ]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>My Dashboard</h1>

      {features.social_features && (
        <div className="dashboard-section">
          <h2>Social</h2>
          <SocialFeed />
        </div>
      )}

      {features.gamification && (
        <div className="dashboard-section">
          <h2>Gamification</h2>
          <PointsDisplay />
          <AchievementsList />
        </div>
      )}

      {features.business_platform && (
        <div className="dashboard-section">
          <h2>Business Tools</h2>
          <BusinessAnalytics />
        </div>
      )}

      {features.future_tech && (
        <div className="dashboard-section">
          <h2>Future Tech</h2>
          <AIFeatures />
          <ARPreview />
        </div>
      )}
    </div>
  );
}

// Example 4: Feature flag with loading states
export function SearchResults({ query }) {
  const { enabled, loading } = useFeatureFlag('advanced_search');

  if (loading) {
    return <SearchSkeleton />;
  }

  if (enabled) {
    return <AdvancedSearchResults query={query} />;
  }

  return <BasicSearchResults query={query} />;
}

// Example 5: Higher-order component usage
import { withFeatureFlag } from '@/components/feature-flags/FeatureFlag';

const GamificationPanel = () => (
  <div className="gamification-panel">
    <h3>Your Points</h3>
    <PointsCounter />
    <RecentAchievements />
  </div>
);

const ConditionalGamificationPanel = withFeatureFlag(
  GamificationPanel,
  'gamification',
  () => <div>Gamification features are not available yet.</div>
);

// Usage in parent component
export function Sidebar() {
  return (
    <aside>
      <ConditionalGamificationPanel />
      <OtherSidebarContent />
    </aside>
  );
}

// Example 6: Server-side feature flag checking
import { checkFeatureFlag } from '@/hooks/useFeatureFlags';

export default async function RestaurantPage({ params }) {
  const restaurant = await getRestaurant(params.id);
  const socialFeaturesEnabled = await checkFeatureFlag('social_features');
  const gamificationEnabled = await checkFeatureFlag('gamification');

  return (
    <div>
      <RestaurantHeader restaurant={restaurant} />

      {socialFeaturesEnabled && (
        <SocialSection restaurantId={params.id} />
      )}

      {gamificationEnabled && (
        <GamificationSection restaurantId={params.id} />
      )}

      <ReviewsSection restaurantId={params.id} />
    </div>
  );
}

// Example 7: Feature flag with user override capability
export function PremiumFeature() {
  const { canAccess, requireFeature } = useFeatureFlagGuard('premium_features');

  const handlePremiumAction = () => {
    requireFeature(
      () => {
        // Execute premium functionality
        startPremiumProcess();
      },
      () => {
        // Show upgrade prompt
        showUpgradeModal();
      }
    );
  };

  return (
    <div>
      <button
        onClick={handlePremiumAction}
        className={canAccess ? 'premium-button' : 'upgrade-button'}
      >
        {canAccess ? 'Use Premium Feature' : 'Upgrade to Premium'}
      </button>
    </div>
  );
}

// Example 8: Feature flag with gradual rollout
export function NewFeatureAnnouncement() {
  const { enabled } = useFeatureFlag('new_feature_announcement');

  // This will only show for users in the rollout percentage
  if (!enabled) return null;

  return (
    <div className="announcement-banner">
      <h3>🎉 New Feature Available!</h3>
      <p>We've added exciting new features to enhance your experience.</p>
      <button onClick={() => showNewFeatureModal()}>
        Learn More
      </button>
    </div>
  );
}

// Example 9: Feature flag with A/B testing capability
export function RecommendationEngine({ userId }) {
  const { enabled: newAlgorithm } = useFeatureFlag('new_recommendation_algorithm');

  if (newAlgorithm) {
    return <NewRecommendationEngine userId={userId} />;
  }

  return <LegacyRecommendationEngine userId={userId} />;
}

// Example 10: Admin-only features
export function AdminPanel() {
  const { enabled: adminTools } = useFeatureFlag('admin_tools');
  const { enabled: advancedModeration } = useFeatureFlag('advanced_moderation');

  return (
    <div className="admin-panel">
      <h1>Admin Dashboard</h1>

      {adminTools && <AdminTools />}

      <FeatureFlag feature="content_moderation">
        <ContentModerationPanel />
      </FeatureFlag>

      {advancedModeration && <AdvancedModerationTools />}
    </div>
  );
}
