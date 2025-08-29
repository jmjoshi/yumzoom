# Feature Flags System

A comprehensive feature flag system for YumZoom that allows administrators to enable/disable features dynamically without code deployments.

## Overview

The feature flags system provides:
- **Dynamic Feature Control**: Enable/disable features from the admin dashboard
- **Gradual Rollouts**: Control feature availability with percentage-based rollouts
- **User Overrides**: Override feature flags for specific users
- **Usage Tracking**: Track feature usage and adoption
- **Audit Trail**: Complete history of feature flag changes
- **Admin Dashboard**: User-friendly interface for managing features

## Database Schema

The system uses several tables:
- `feature_flags`: Main feature flag definitions
- `feature_flag_overrides`: User-specific overrides
- `feature_flag_usage`: Usage tracking
- `feature_flag_audit_log`: Change history

## Setup

1. **Run the setup script**:
   ```bash
   node scripts/setup-feature-flags.js
   ```

2. **Access the admin dashboard**:
   Visit `/admin/feature-flags` in your application

## Usage

### Client-Side Components

#### FeatureFlag Component
```tsx
import { FeatureFlag } from '@/components/feature-flags/FeatureFlag';

function MyComponent() {
  return (
    <div>
      {/* Always visible content */}
      <h1>Welcome to YumZoom</h1>

      {/* Conditionally render social features */}
      <FeatureFlag
        feature="social_features"
        fallback={<p>Social features coming soon!</p>}
      >
        <SocialFeatures />
      </FeatureFlag>

      {/* Gamification features */}
      <FeatureFlag feature="gamification">
        <GamificationPanel />
      </FeatureFlag>
    </div>
  );
}
```

#### useFeatureFlag Hook
```tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { enabled, loading, error } = useFeatureFlag('advanced_analytics');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {enabled ? (
        <AdvancedAnalyticsDashboard />
      ) : (
        <BasicAnalyticsDashboard />
      )}
    </div>
  );
}
```

#### Multiple Feature Flags
```tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { features, loading } = useFeatureFlags([
    'social_features',
    'gamification',
    'advanced_analytics'
  ]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {features.social_features && <SocialFeatures />}
      {features.gamification && <GamificationPanel />}
      {features.advanced_analytics && <AdvancedAnalytics />}
    </div>
  );
}
```

### Higher-Order Component
```tsx
import { withFeatureFlag } from '@/components/feature-flags/FeatureFlag';

const GamificationDashboard = () => <div>Gamification features here</div>;

const ConditionalGamificationDashboard = withFeatureFlag(
  GamificationDashboard,
  'gamification',
  () => <div>Gamification coming soon!</div>
);
```

### Server-Side Usage
```tsx
import { checkFeatureFlag } from '@/hooks/useFeatureFlags';

export default async function Page() {
  const socialFeaturesEnabled = await checkFeatureFlag('social_features');

  return (
    <div>
      {socialFeaturesEnabled && <SocialFeatures />}
    </div>
  );
}
```

### Imperative Usage
```tsx
import { useFeatureFlagGuard } from '@/components/feature-flags/FeatureFlag';

function MyComponent() {
  const { canAccess, requireFeature } = useFeatureFlagGuard('premium_features');

  const handlePremiumAction = () => {
    requireFeature(
      () => {
        // Execute premium action
        console.log('Premium action executed');
      },
      () => {
        // Show upgrade prompt
        alert('This feature requires a premium subscription');
      }
    );
  };

  return (
    <button onClick={handlePremiumAction}>
      Premium Action
    </button>
  );
}
```

## API Endpoints

### Feature Flags Management
- `GET /api/feature-flags` - Get all feature flags
- `POST /api/feature-flags` - Create a new feature flag
- `GET /api/feature-flags/[id]` - Get a specific feature flag
- `PUT /api/feature-flags/[id]` - Update a feature flag
- `DELETE /api/feature-flags/[id]` - Delete a feature flag

### Feature Flag Checking
- `GET /api/feature-flags/check?feature=name` - Check if a feature is enabled
- `POST /api/feature-flags/check` - Check multiple features at once

## Admin Dashboard

The admin dashboard at `/admin/feature-flags` provides:

- **Feature Overview**: See all features with their current status
- **Toggle Features**: Enable/disable features instantly
- **Rollout Control**: Adjust rollout percentages
- **Create Features**: Add new feature flags
- **Edit Features**: Modify existing feature configurations
- **Usage Analytics**: View feature adoption metrics

## Database Functions

### Core Functions
- `is_feature_enabled(feature_name, user_id)` - Check if a feature is enabled for a user
- `get_enabled_features(user_id)` - Get all enabled features for a user
- `create_feature_flag(...)` - Create a new feature flag
- `update_feature_flag(...)` - Update an existing feature flag
- `track_feature_usage(...)` - Track feature usage

### Example Usage
```sql
-- Check if social features are enabled for a user
SELECT is_feature_enabled('social_features', 'user-uuid-here');

-- Get all enabled features for a user
SELECT * FROM get_enabled_features('user-uuid-here');

-- Track feature usage
SELECT track_feature_usage('social_features', 'user-uuid-here', 'viewed');
```

## Best Practices

### Feature Flag Naming
- Use snake_case for feature names (e.g., `social_features`, `advanced_analytics`)
- Be descriptive and specific
- Group related features with consistent prefixes

### Rollout Strategy
- Start with 0% rollout for new features
- Gradually increase percentage (10%, 25%, 50%, 100%)
- Monitor usage and error rates during rollout
- Have rollback plan ready

### Cleanup
- Remove feature flags once features are fully rolled out and stable
- Archive old feature flags instead of deleting if you need historical data
- Regularly review and clean up unused flags

### Security
- Feature flags are checked on both client and server side
- Server-side checks are authoritative
- Use proper authentication for admin endpoints

## Default Features

The system comes with these pre-configured features:

- `social_features` - Social networking features
- `gamification` - Points, badges, and leaderboards
- `advanced_analytics` - Detailed analytics dashboard
- `content_versioning` - Version control for content
- `accessibility_features` - Enhanced accessibility
- `future_tech` - AR, VR, AI features
- `moderation_tools` - Content moderation
- `business_platform` - Business tools for restaurants

## Troubleshooting

### Feature Not Showing
1. Check if the feature flag is enabled in the admin dashboard
2. Verify the feature name matches exactly
3. Check browser console for errors
4. Ensure the user is in the rollout percentage

### API Errors
1. Verify Supabase connection
2. Check service role key permissions
3. Ensure database functions are created
4. Check server logs for detailed errors

### Performance Issues
1. Feature flag checks are cached where possible
2. Use `useFeatureFlags` for multiple checks
3. Consider server-side preloading for critical features

## Migration Guide

### From Environment Variables
If you're currently using environment variables for feature toggles:

1. Create feature flags in the admin dashboard
2. Replace environment variable checks with feature flag hooks
3. Update deployment scripts to set feature flags instead of env vars

### From Manual Toggles
For hardcoded feature toggles:

1. Create corresponding feature flags
2. Replace conditional logic with FeatureFlag components
3. Test thoroughly before removing old code

## Monitoring

Monitor feature flag usage through:
- Admin dashboard analytics
- Database usage tracking tables
- Application performance metrics
- User feedback and support tickets

## Support

For issues or questions:
1. Check the admin dashboard for feature status
2. Review database logs for errors
3. Verify API endpoints are responding
4. Check browser developer tools for client-side issues
