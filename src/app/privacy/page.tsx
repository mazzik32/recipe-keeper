import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-cream font-sans text-warm-gray-700">
            <main className="max-w-4xl mx-auto px-6 py-20 bg-white rounded-3xl shadow-lg my-10">
                <header className="mb-8">
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                        Privacy Policy
                    </h1>
                    <div className="text-warm-gray-500 text-sm">
                        Last updated: March 2026
                    </div>
                </header>

                <div className="prose prose-peach max-w-none text-warm-gray-600">
                    <p className="mb-4">
                        At RecipeKeeper, we believe your family recipes are private
                        treasures. We protect your data with the same care you put into your
                        cooking. We only collect what is necessary to provide our service.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Information we collect
                    </h2>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                        <li>
                            <strong>Account Information:</strong> When you sign up, we collect
                            your email address to create and secure your account.
                        </li>
                        <li>
                            <strong>User Content:</strong> We store the recipes, photos, and
                            notes you upload or scan so you can access them from any device.
                            This data is private to you and those you explicitly choose to
                            share it with.
                        </li>
                        <li>
                            <strong>Usage Data:</strong> We may collect anonymous, aggregated
                            usage data to understand how our app is used and to improve our
                            service (e.g., which features are most popular).
                        </li>
                        <li>
                            <strong>Payment data:</strong> Payments are processed by our
                            Merchant of Record. We do not store or see your full credit card
                            number.
                        </li>
                    </ul>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        How we use your data
                    </h2>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                        <li>To provide and maintain the RecipeKeeper service.</li>
                        <li>
                            To process your recipe scans using our AI technology (your images
                            are processed securely and not used to train public models).
                        </li>
                        <li>
                            To send you important service updates, receipts, and account
                            notifications.
                        </li>
                    </ul>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        AI and Recipe Processing
                    </h2>
                    <p className="mb-4">
                        When you use our &quot;Smart Scanning&quot; feature, your image is
                        processed by our AI system to extract text and structure the recipe.
                        This data is processed transiently and the original image is stored
                        securely in your private account.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Data Security
                    </h2>
                    <p className="mb-4">
                        We use industry-standard encryption to protect your data in transit
                        and at rest. Your recipes are backed up regularly to ensure they are
                        never lost.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Data Sharing
                    </h2>
                    <p className="mb-4">
                        We do not sell your personal data or your recipes to third parties.
                        We only share data with trusted service providers (like our payment
                        processor or cloud hosting provider) who are contractually strict
                        about data protection.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Your Rights
                    </h2>
                    <p className="mb-4">
                        You can export your recipes or delete your account at any time. If
                        you delete your account, all your data, including recipes and
                        photos, will be permanently removed from our servers.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Contact
                    </h2>
                    <p className="mb-4">
                        If you have any questions about your privacy, please contact us at{" "}
                        <a
                            href="mailto:support@mail.recipekeeper.org"
                            className="text-peach-600 hover:text-peach-700 font-semibold"
                        >
                            support@mail.recipekeeper.org
                        </a>
                        .
                    </p>

                    <div className="mt-8 flex gap-4 pt-6 border-t border-warm-gray-200">
                        <Link
                            href="/"
                            className="text-peach-600 hover:text-peach-700 font-semibold"
                        >
                            Back to home
                        </Link>
                        <Link
                            href="/terms"
                            className="text-peach-600 hover:text-peach-700 font-semibold"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
