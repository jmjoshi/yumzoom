# YumZoom - Family Restaurant Rating Platform

A Next.js application that allows families to discover, rate, and review restaurants together with comprehensive role-based access control and business intelligence features.

## Features

### Core Functionality
- **Role-Based Access Control**: 4-tier user system (Customer, Restaurant Owner, Business Partner, Admin)
- **Family Management**: Create and manage family member profiles
- **Restaurant Discovery**: Browse restaurants with detailed information and images
- **Rating System**: Rate restaurants and menu items (1-10 scale)
- **Restaurant Characteristics Rating**: Detailed 1-10 star ratings for ambience, decor, service, cleanliness, noise level, value for money, food quality, and overall rating
- **Dashboard Analytics**: View family dining patterns and insights
- **Business Intelligence**: Restaurant analytics and performance metrics
- **Admin Interface**: Comprehensive restaurant and menu management

### Current Implementation
- ✅ Role-based access control with 4 user types
- ✅ User authentication with Supabase
- ✅ Protected routes and components
- ✅ Family member management
- ✅ Restaurant browsing and rating with images
- ✅ Restaurant characteristics rating system (8 detailed categories)
- ✅ Admin restaurant/menu management
- ✅ Restaurant owner analytics dashboard
- ✅ Business partner platform access
- ✅ Security features and monitoring
- ✅ Responsive design with proper error handling

## User Roles & Access Control

### Customer (Default Role)
- Browse and search restaurants
- Create and manage family profiles
- Rate and review restaurants
- View personal dashboard and analytics
- Access family features and social functionality

### Restaurant Owner
- All customer features
- Access restaurant analytics dashboard
- Manage restaurant profiles and information
- View customer feedback and reviews
- Track restaurant performance metrics

### Business Partner
- All customer features
- Access business intelligence platform
- View market analytics and trends
- Manage business partnerships
- Access enterprise-level insights

### Admin
- Full platform access and management
- User and role management
- Restaurant and menu administration
- System monitoring and analytics
- Platform configuration and settings

## Test Users

For testing different roles, use these pre-configured accounts:

### Customers
- sarah.johnson@example.com / password123
- mike.williams@example.com / password123
- emma.brown@example.com / password123

### Restaurant Owners  
- maria.gonzalez@example.com / password123
- david.chen@example.com / password123
- lisa.taylor@example.com / password123

### Business Partners
- james.anderson@example.com / password123
- jennifer.white@example.com / password123

### Admins
- admin@yumzoom.com / admin123
- jane.smith@example.com / password123

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jmjoshi/yumzoom.git
   cd yumzoom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Set up the database**
   - Go to your Supabase dashboard
   - Run the SQL from `database/schema.sql`
   - Run the SQL from `database/fix-admin-policies.sql`
   - Run the SQL from `database/add-restaurant-images.sql` (for restaurant images)
   - Run the SQL from `database/test-rbac.sql` (for test users with different roles)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
yumzoom/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin interface (Admin only)
│   ├── api/               # API routes
│   ├── business-dashboard/ # Business partner dashboard
│   ├── dashboard/         # User dashboard
│   ├── family/            # Family management
│   ├── restaurant-owner/  # Restaurant owner dashboard
│   └── restaurants/       # Restaurant pages
├── components/            # Reusable React components
│   ├── auth/              # Authentication & role-based protection
│   ├── business-platform/ # Business intelligence components
│   ├── restaurant/        # Restaurant-related components
│   └── ui/                # UI components
├── database/              # SQL schemas and migrations
├── documents/             # Project documentation
│   └── requirements/      # Feature requirements docs
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   └── rbac.ts           # Role-based access control framework
├── public/                # Static assets
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## Development Workflow

### Current Baseline
This repository represents the **base working application** before implementing AI-suggested features. Key commit: `base working application before adding features suggested by AI Agent`

### Feature Implementation Roadmap
See `documents/requirements/feature-roadmap.md` for detailed implementation priorities and timelines.

### Database Migrations
SQL files in the `database/` directory:
- `schema.sql` - Initial database setup
- `fix-admin-policies.sql` - Row Level Security policies for admin operations
- `fix-images.sql` - Update broken image URLs
- `add-restaurant-images.sql` - Add Unsplash image URLs to restaurants
- `test-rbac.sql` - Create test users for all roles
- `social-features-schema.sql` - Social functionality and user interactions
- `business-platform-schema.sql` - Business intelligence and analytics
- `restaurant-analytics-schema.sql` - Restaurant owner analytics

## Contributing

1. Create a feature branch from `main`
2. Implement features following the requirements documents
3. Test thoroughly
4. Submit a pull request

## Security

- Role-based access control (RBAC) with 4 user types
- Protected routes and components
- Environment variables are excluded from version control
- Supabase Row Level Security (RLS) policies implemented
- Security monitoring and alerts configured
- Rate limiting and geo-blocking features included
- Unauthorized access protection and proper error handling

## Documentation

Comprehensive requirements documents available in `documents/requirements/`:
- `admin.md` - Admin interface requirements
- `search-filtering.md` - Search and filtering features
- `analytics-dashboard.md` - Analytics and insights
- `enhanced-reviews.md` - Review system enhancements
- `user-profiles.md` - User profile management
- `mobile-application.md` - Mobile app features
- `additional-core-features.md` - Platform enhancements
- `feature-roadmap.md` - Implementation priorities

## License

This project is private and proprietary.

## Support

For questions or issues, contact the development team.
