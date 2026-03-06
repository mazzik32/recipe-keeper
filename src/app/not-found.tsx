import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
    return (
        <div className="min-h-screen font-sans text-warm-gray-600 bg-cream flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 fade-in opacity-0 animate-[fadeInUp_1s_ease_0.2s_forwards]">
                <div className="flex justify-center mb-8">
                    <Image
                        src="/assets/RecipeKeeperLogo.png"
                        alt="RecipeKeeper Logo"
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain drop-shadow-sm"
                    />
                </div>

                <h1 className="font-display font-medium text-warm-gray-700 leading-[1.15] text-[clamp(42px,8vw,80px)] tracking-[-0.02em]">
                    404
                </h1>

                <h2 className="font-display text-[28px] text-warm-gray-700 mb-2">
                    Page Not Found
                </h2>

                <p className="text-warm-gray-500 text-lg mb-8">
                    It looks like this recipe got lost in the shuffle. We can't seem to find the page you're looking for.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center font-semibold text-[17px] no-underline transition-all duration-300 rounded-full px-9 py-[18px] bg-peach-300 text-warm-gray-700 shadow-[0_4px_24px_rgba(248,168,136,0.35)] hover:bg-peach-400 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(248,168,136,0.45)]"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
