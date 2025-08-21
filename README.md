# YumZoom - Family Restaurant Rating Platform

A Next.js application that allows families to discover, rate, and review restaurants together.

## Features

### Core Functionality
- **Family Management**: Create and manage family member profiles
- **Restaurant Discovery**: Browse restaurants with detailed information
- **Rating System**: Rate restaurants and menu items (1-10 scale)
- **Dashboard Analytics**: View family dining patterns and insights
- **Admin Interface**: Comprehensive restaurant and menu management

### Current Implementation
- ✅ User authentication with Supabase
- ✅ Family member management
- ✅ Restaurant browsing and rating
- ✅ Admin restaurant/menu management
- ✅ Security features and monitoring
- ✅ Responsive design

### Planned Features (AI Agent Recommendations)
- 🔄 Advanced search and filtering
- 🔄 Enhanced review system with photos
- 🔄 User profiles and preferences
- 🔄 Analytics dashboard
- 🔄 Mobile application (PWA)
- 🔄 Social features and integrations

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
│   ├── admin/             # Admin interface
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── family/            # Family management
│   └── restaurants/       # Restaurant pages
├── components/            # Reusable React components
├── database/              # SQL schemas and migrations
├── documents/             # Project documentation
│   └── requirements/      # Feature requirements docs
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
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

## Contributing

1. Create a feature branch from `main`
2. Implement features following the requirements documents
3. Test thoroughly
4. Submit a pull request

## Security

- Environment variables are excluded from version control
- Supabase Row Level Security (RLS) policies implemented
- Security monitoring and alerts configured
- Rate limiting and geo-blocking features included

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
