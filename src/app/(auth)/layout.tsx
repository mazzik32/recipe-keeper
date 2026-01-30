import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-warm-white border-b border-warm-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/RecipeKeeperLogo.png"
              alt="RecipeKeeper Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="font-display text-xl font-semibold text-warm-gray-700">
              RecipeKeeper
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
