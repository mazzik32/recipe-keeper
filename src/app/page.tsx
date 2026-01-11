import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-warm-white border-b border-warm-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="font-display text-2xl text-warm-gray-700">
              Recipe Keeper
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-warm-gray-500 hover:text-warm-gray-700 font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700 font-medium px-5 py-2 rounded-xl transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl text-warm-gray-700 mb-6">
              Preserve Your Family&apos;s
              <span className="text-peach-500"> Culinary Legacy</span>
            </h1>
            <p className="text-xl text-warm-gray-500 mb-10">
              Digitalize handwritten recipes from Mom, Grandma, and generations
              past. Scan, organize, and create beautiful recipe books to pass
              down for years to come.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700 font-medium px-8 py-4 rounded-xl transition-colors text-lg shadow-sm"
              >
                Start Preserving Recipes
              </Link>
              <Link
                href="#features"
                className="bg-transparent hover:bg-peach-50 text-peach-600 font-medium px-8 py-4 rounded-xl border-2 border-peach-300 transition-colors text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features */}
          <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
            <div className="bg-warm-white rounded-2xl p-8 border border-warm-gray-100">
              <div className="w-14 h-14 rounded-xl bg-peach-100 flex items-center justify-center mb-6">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="font-display text-xl text-warm-gray-700 mb-3">
                Scan Recipes
              </h3>
              <p className="text-warm-gray-500">
                Upload photos of handwritten recipes and let AI extract the
                ingredients and instructions automatically.
              </p>
            </div>

            <div className="bg-warm-white rounded-2xl p-8 border border-warm-gray-100">
              <div className="w-14 h-14 rounded-xl bg-peach-100 flex items-center justify-center mb-6">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-display text-xl text-warm-gray-700 mb-3">
                Organize & Categorize
              </h3>
              <p className="text-warm-gray-500">
                Sort recipes by category, add tags, and remember where each
                recipe came from &mdash; Mom, Grandma, or Aunt Maria.
              </p>
            </div>

            <div className="bg-warm-white rounded-2xl p-8 border border-warm-gray-100">
              <div className="w-14 h-14 rounded-xl bg-peach-100 flex items-center justify-center mb-6">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="font-display text-xl text-warm-gray-700 mb-3">
                Create Recipe Books
              </h3>
              <p className="text-warm-gray-500">
                Generate beautifully styled PDF recipe books to print, share, or
                gift to family members.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-32 text-center">
            <p className="font-script text-2xl text-peach-600 mb-4">
              &ldquo;Because the best recipes are made with love&rdquo;
            </p>
            <p className="text-warm-gray-400">
              Start your family cookbook today
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-warm-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Recipe Keeper. Made with love for
            families everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
