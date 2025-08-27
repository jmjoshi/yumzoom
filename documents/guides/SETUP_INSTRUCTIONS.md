# YumZoom Setup Instructions

This guide will walk you through setting up the YumZoom food rating application step by step.

## Prerequisites

Make sure you have the following installed on your system:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Create and Set Up Supabase Project

### 1.1 Create Supabase Account and Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account or sign in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `yumzoom-app` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for the project to be set up (takes 1-2 minutes)

### 1.2 Get Your Supabase Credentials
1. Once your project is ready, go to **Settings** > **API**
2. Copy the following values (you'll need them later):
   - **Project URL** (under Project Configuration)
   - **anon public** key (under Project API keys)
   - **service_role** key (under Project API keys) - Keep this secret!

### 1.3 Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire content from the `database/schema.sql` file in this project
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema
6. You should see "Success. No rows returned" message

## Step 2: Clone and Set Up the Project

### 2.1 Clone the Repository
```bash
# Clone the repository
git clone https://github.com/yourusername/yumzoom-food-rating-app.git

# Navigate to the project directory
cd yumzoom-food-rating-app
```

### 2.2 Install Dependencies
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 2.3 Set Up Environment Variables
1. Create a `.env.local` file in the root directory
2. Add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Replace the placeholder values with your actual Supabase credentials from Step 1.2

## Step 3: Run the Application

### 3.1 Start Development Server
```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

### 3.2 Open the Application
1. Open your browser
2. Navigate to [http://localhost:3000](http://localhost:3000)
3. You should see the YumZoom homepage

## Step 4: Test the Application

### 4.1 Create a Test Account
1. Click "Sign Up" in the navigation
2. Fill in the registration form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: TestPass123
   - Phone numbers (optional)
3. Click "Create Account"
4. Check your email for verification (if email is configured)

### 4.2 Sign In and Test Features
1. Sign in with your test account
2. Navigate to "Restaurants" to see sample data
3. Click on a restaurant to view menu items
4. Try rating a menu item
5. Check that your rating is saved and displayed

## Step 5: Configure Authentication (Optional)

### 5.1 Email Configuration
If you want email verification and password reset:
1. Go to **Authentication** > **Settings** in Supabase
2. Configure SMTP settings or use a service like SendGrid
3. Update email templates as needed

### 5.2 Social Login (Optional)
To add Google/GitHub login:
1. Go to **Authentication** > **Providers** in Supabase
2. Enable desired providers
3. Configure OAuth credentials
4. Update the authentication components in the app

## Step 6: Production Deployment

### 6.1 Deploy to Vercel (Recommended)
1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Sign up/in and connect your GitHub account
4. Click "New Project"
5. Import your repository
6. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
7. Deploy

### 6.2 Update Supabase Settings
1. In Supabase, go to **Authentication** > **URL Configuration**
2. Add your production domain to allowed domains
3. Update redirect URLs if needed

## Troubleshooting

### Common Issues

1. **"Failed to connect to Supabase"**
   - Check your environment variables are correct
   - Ensure you're using the right project URL and keys
   - Verify the `.env.local` file is in the root directory

2. **"Schema errors" when running SQL**
   - Make sure to run the complete schema from `database/schema.sql`
   - Check for any SQL syntax errors in the console

3. **"Authentication not working"**
   - Verify your Supabase project has authentication enabled
   - Check that RLS policies are properly set up
   - Ensure environment variables are loaded correctly

4. **"Page not found" errors**
   - Make sure you're using Next.js 14 with App Router
   - Check that all required files are in the correct directories

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal/command prompt for server errors
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Check that Supabase project is active and accessible

### Development Tips

1. **Hot Reload**: The development server supports hot reload - changes will automatically refresh
2. **Database Changes**: Use Supabase dashboard to view and modify data during development
3. **Styling**: Tailwind classes are available - refer to [tailwindcss.com](https://tailwindcss.com) for documentation
4. **Type Safety**: TypeScript is configured - use `npm run type-check` to validate types

## Next Steps

Once your application is running:
1. Customize the styling and branding
2. Add more restaurants and menu items through the Supabase dashboard
3. Implement additional features like photo uploads
4. Set up monitoring and analytics
5. Configure proper backup and security measures for production

## File Structure Reference

```
yumzoom-food-rating-app/
├── app/                    # Next.js pages (App Router)
├── components/             # React components
├── database/              # Database schema
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── public/                # Static assets
├── styles/                # CSS styles
├── types/                 # TypeScript definitions
├── .env.local            # Environment variables (create this)
├── package.json          # Dependencies
└── README.md             # Project documentation
```

That's it! Your YumZoom application should now be up and running. Enjoy rating your favorite foods! 🍽️