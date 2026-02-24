import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-cream font-sans text-warm-gray-700">
            <main className="max-w-4xl mx-auto px-6 py-20 bg-white rounded-3xl shadow-lg my-10">
                <header className="mb-8">
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                        Terms of Service
                    </h1>
                    <div className="text-warm-gray-500 text-sm">
                        Last updated: January 18, 2026
                    </div>
                </header>

                <div className="prose prose-peach max-w-none text-warm-gray-600">
                    <p className="mb-4">
                        By using RecipeKeeper, you agree to these terms with visionite gmbh.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Service Overview
                    </h2>
                    <p className="mb-4">
                        RecipeKeeper is a digital recipe management service that allows you to
                        scan, store, organize, and share your personal recipes. The Service
                        is available via our website and designated applications.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Account Registration
                    </h2>
                    <p className="mb-4">
                        To access certain features of RecipeKeeper, you must create an
                        account. You agree to provide accurate, current, and complete
                        information during the registration process and to keep your account
                        information updated.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        User Content
                    </h2>
                    <p className="mb-4">
                        You retain full ownership of the recipes, images, and text (&quot;User
                        Content&quot;) you upload to RecipeKeeper. By uploading User
                        Content, you grant us a worldwide, non-exclusive, royalty-free
                        license to store, display, and process your content solely for the
                        purpose of providing the Service to you (e.g., displaying your
                        recipes on your device).
                    </p>
                    <p className="mb-4">
                        You represent and warrant that you own or have the necessary rights
                        to upload any User Content and that its use by RecipeKeeper does not
                        violate any third-party rights.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Prohibited Conduct
                    </h2>
                    <p className="mb-4">
                        You agree not to misuse the Service. This includes, but is not
                        limited to: uploading illegal or harmful content, attempting to
                        breach our security measures, or using the Service for any purpose
                        other than personal use without our explicit consent.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Access and Usage Rights
                    </h2>
                    <p className="mb-4">
                        For paid or free accounts, we grant you a personal,
                        non-transferable, limited right to access and use the RecipeKeeper
                        application for your personal use. You may not resell or redistribute
                        your account access or your acquired credits.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Purchases and Payments
                    </h2>
                    <p className="mb-4">
                        Paid upgrades, credits, and subscriptions are processed through native
                        In-App Purchases (via Apple App Store or Google Play Store) for our mobile
                        applications, or through our Merchant of Record, Paddle, for web purchases.
                        We do not process or store your payment card information directly.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Credits and Account
                    </h2>
                    <p className="mb-4">
                        RecipeKeeper operates on a credit-based system. All purchased credits are permanently
                        linked to your RecipeKeeper account email address. Once logged in, your balance automatically
                        syncs across all devices and platforms (Apple, Google, Web). Because credits are consumable
                        items tied to your account profile, there is no "Restore Purchases" mechanism necessary or
                        available.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Refunds
                    </h2>
                    <p className="mb-4">
                        Refunds for mobile In-App Purchases are subject to the respective refund policies
                        of Apple and Google, and must be requested directly through their platforms.
                        Refunds for web purchases processed via our Merchant of Record, Paddle, are
                        provided at the sole discretion of visionite gmbh or Paddle on a case-by-case
                        basis and may be refused if we find evidence of fraud, refund abuse, or other
                        manipulative behaviour.
                    </p>
                    <p className="mb-4">
                        This does not affect your rights as a Consumer in relation to
                        Products which are not as described, faulty or not fit for purpose.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Consumer Right to Cancel
                    </h2>
                    <p className="mb-4">
                        If you are a Consumer and unless the below exception applies, you
                        have the right to cancel this Agreement within 14 days without giving any reason.
                        The cancellation period will expire after 14 days from the day after completion of the
                        Transaction.
                    </p>

                    <p className="mb-4">
                        To cancel your order or subscription:
                        <br />• For Apple App Store or Google Play Store subscriptions, you must manage
                        cancellations and refund requests directly within your device&apos;s account settings.
                        <br />• For web purchases via Paddle, you must inform visionite gmbh or Paddle of your
                        decision. To ensure immediate processing, please do so by contacting us. Please note
                        that in respect of subscription services your right to cancel is only present following
                        the initial subscription and not upon each automatic renewal.
                    </p>

                    <p className="mb-4">
                        You also have the right to inform us using a model cancellation form
                        or by making any other clear, unambiguous statement through our
                        available communication channels. If you use our “Contact Us” form
                        online, we will communicate acknowledgment of receipt of your
                        cancellation request to you without delay.
                    </p>

                    <p className="mb-4">
                        <strong>Effect of Cancellation</strong>
                        <br />
                        If you cancel this Agreement as permitted above, we will reimburse
                        to you all payments received from you.
                    </p>

                    <p className="mb-4">
                        We will make the reimbursement without undue delay, and not later
                        than 14 days after the day on which we are informed about your
                        decision to cancel this Agreement.
                    </p>

                    <p className="mb-4">
                        We will make the reimbursement using the same means of payment as
                        you used for the initial transaction and you will not incur any fees
                        as a result of the reimbursement.
                    </p>

                    <p className="mb-4">
                        <strong>Exception to the Right to Cancel</strong>
                        <br />
                        Your right as a Consumer to cancel your order does not apply to the
                        supply of Digital Content that you have started to download, stream
                        or otherwise acquire and to Products which you have had the benefit
                        of.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Availability
                    </h2>
                    <p className="mb-4">
                        The Service is provided “as is.” We strive for high availability but
                        cannot guarantee that the Service will be uninterrupted or
                        error-free due to maintenance or external factors.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Privacy
                    </h2>
                    <p className="mb-4">
                        We do not use analytics or tracking. See the{" "}
                        <Link
                            href="/privacy"
                            className="text-peach-600 hover:text-peach-700 font-semibold"
                        >
                            Privacy Policy
                        </Link>{" "}
                        for details.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Legal Information
                    </h2>
                    <p className="mb-4">
                        <strong>visionite gmbh</strong>
                        <br />
                        Legal Business Name
                    </p>

                    <div className="mt-8 flex gap-4 pt-6 border-t border-warm-gray-200">
                        <Link
                            href="/"
                            className="text-peach-600 hover:text-peach-700 font-semibold"
                        >
                            Back to home
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-peach-600 hover:text-peach-700 font-semibold"
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </main>
        </div >
    );
}
