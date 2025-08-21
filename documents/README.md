# YumZoom Food Rating Application

A modern full-stack web application for rating restaurant menu items and tracking family dining preferences. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Secure sign-up and sign-in with email/password
- **Family Member Support**: Add family members and track their individual ratings
- **Restaurant Browsing**: View restaurants with detailed information
- **Menu Item Rating**: Rate dishes on a 1-10 scale
- **Rating History**: View and edit previous ratings
- **Average Ratings**: See community average ratings for menu items
- **Responsive Design**: Works great on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/yumzoom-food-rating-app.git
cd yumzoom-food-rating-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and API keys
3. Go to SQL Editor and run the schema from `database/schema.sql`

### 4. Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Authentication routes
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── auth/              # Authentication components
│   ├── layouts/           # Layout components
│   ├── restaurant/        # Restaurant-related components
│   └── ui/                # Base UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── styles/                # Global styles
├── database/              # Database schema and migrations
└── public/                # Static assets
```

## Key Components

### Authentication
- `SignInForm`: User login form with validation
- `SignUpForm`: Registration form with user profile creation
- `useAuth`: Authentication context and hooks

### Restaurant Features
- `RestaurantCard`: Display restaurant information
- `MenuItemCard`: Interactive menu item with rating functionality
- `Rating`: Reusable rating component (1-10 scale)

### UI Components
- `Button`: Customizable button with variants and loading states
- `Input`: Form input with validation and error display
- `Card`: Flexible card layout component

## Database Schema

The application uses the following main tables:

- **user_profiles**: Extended user information
- **family_members**: Family member associations
- **restaurants**: Restaurant information
- **menu_items**: Menu items for each restaurant
- **ratings**: User ratings for menu items

## API Routes

- `/api/restaurants`: Get restaurants list
- `/api/restaurants/[id]`: Get restaurant details with menu items
- `/api/ratings`: CRUD operations for ratings
- `/api/family-members`: Manage family members

## Features Implementation

### User Registration (FR004, FR005)
- Secure account creation with email/password
- Collects first name, last name, email, and multiple phone numbers
- Password validation and encryption via Supabase Auth

### Rating System (FR001, FR002, FR006)
- 1-10 rating scale for menu items
- Support for family member ratings
- Automatic average rating calculation
- Real-time rating updates

### Rating History (FR003)
- View previous ratings when revisiting restaurants
- Edit and delete existing ratings
- Track rating history over time

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Testing

Run the test suite:

```bash
npm run test
# or
yarn test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/yumzoom-food-rating-app/issues) page
2. Create a new issue with detailed information
3. For general questions, start a [Discussion](https://github.com/yourusername/yumzoom-food-rating-app/discussions)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Social features (friends, sharing ratings)
- [ ] Restaurant recommendations based on ratings
- [ ] Photo uploads for menu items
- [ ] Advanced search and filtering
- [ ] Rating analytics and insights