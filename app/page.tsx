import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Star, Users, TrendingUp, Shield } from 'lucide-react';
import { PWAInstallButton } from '@/components/pwa/PWAInstallPrompt';
import { APP_NAME, ROUTES } from '@/lib/constants';

export default function HomePage() {
  const features = [
    {
      icon: Star,
      title: 'Rate Menu Items',
      description: 'Give detailed ratings from 1-10 for each dish you try at restaurants.',
    },
    {
      icon: Users,
      title: 'Family Ratings',
      description: "Track ratings for different family members to remember everyone's preferences.",
    },
    {
      icon: TrendingUp,
      title: 'Discover Trends',
      description: 'See average ratings and discover the best dishes at your favorite places.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your dining experiences and ratings are kept secure and private.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to {APP_NAME}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Rate your dining experiences and discover great food with your family
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={ROUTES.SIGN_UP}>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href={ROUTES.RESTAURANTS}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-50">
                  Browse Restaurants
                </Button>
              </Link>
              <div className="w-full sm:w-auto">
                <PWAInstallButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose {APP_NAME}?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Keep track of your dining experiences and make better food choices for you and your family
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get the Mobile App Experience
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Install YumZoom as a mobile app for the best experience. Enjoy offline access, 
              push notifications, and a native app feel on your device.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <PWAInstallButton />
              <p className="text-sm text-gray-500">
                Available for iOS, Android, and Desktop
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Start rating your dining experiences in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Your Account</h3>
              <p className="text-gray-600">
                Sign up with your email and add family members to track everyone's preferences
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Find Restaurants</h3>
              <p className="text-gray-600">
                Browse restaurants and explore their menus to find dishes you want to try
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Rate Your Experience</h3>
              <p className="text-gray-600">
                Give ratings from 1-10 for each dish and see how your family's tastes compare
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Rating?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of families discovering great food together
          </p>
          <Link href={ROUTES.SIGN_UP}>
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}