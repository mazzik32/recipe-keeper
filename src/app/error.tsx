"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service here
        console.error("Global Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen font-sans text-warm-gray-600 bg-cream flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 fade-in opacity-0 animate-[fadeInUp_1s_ease_0.2s_forwards]">
                <div className="flex justify-center mb-8">
                    <Image
                        src="/assets/RecipeKeeperLogo.png"
                        alt="RecipeKeeper Logo"
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain drop-shadow-sm grayscale"
                    />
                </div>

                <h1 className="font-display font-medium text-warm-gray-700 leading-[1.15] text-[clamp(42px,8vw,80px)] tracking-[-0.02em]">
                    Oops!
                </h1>

                <h2 className="font-display text-[28px] text-warm-gray-700 mb-2">
                    Something went wrong
                </h2>

                <p className="text-warm-gray-500 text-lg mb-8">
                    Our kitchen encountered an unexpected issue while preparing this page. We've been notified.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center font-semibold text-[17px] no-underline transition-all duration-300 rounded-full px-8 py-[16px] bg-white border border-peach-200 text-warm-gray-700 hover:bg-peach-50 hover:border-peach-300"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center font-semibold text-[17px] no-underline transition-all duration-300 rounded-full px-8 py-[16px] bg-peach-300 text-warm-gray-700 shadow-[0_4px_24px_rgba(248,168,136,0.35)] hover:bg-peach-400 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(248,168,136,0.45)]"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
