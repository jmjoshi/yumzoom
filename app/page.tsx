export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-orange-600 mb-4">YumZoom</h1>
          <p className="text-xl text-gray-600 mb-8">
            Rate, review, and discover your favorite restaurant dishes
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/restaurants"
              className="bg-orange-600 text-white px-8 py-3 rounded-full hover:bg-orange-700 transition-colors"
            >
              Browse Restaurants
            </a>
            <a
              href="/signup"
              className="bg-white text-orange-600 px-8 py-3 rounded-full border-2 border-orange-600 hover:bg-orange-50 transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Rate Dishes</h2>
            <p className="text-gray-600">
              Share your dining experiences by rating individual menu items
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Discover New Places</h2>
            <p className="text-gray-600">
              Find top-rated dishes at restaurants near you
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Track Favorites</h2>
            <p className="text-gray-600">
              Keep track of your favorite dishes and restaurants
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
