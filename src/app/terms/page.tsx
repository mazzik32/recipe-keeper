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
                        Last updated: March 2026
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
                        License
                    </h2>
                    <p className="mb-4">
                        For paid or free accounts, we grant you a personal,
                        non-transferable, limited license to access and use the RecipeKeeper
                        application for your personal use. You may not resell or redistribute
                        your account access or license keys.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Payments
                    </h2>
                    <p className="mb-4">
                        Paid upgrades and subscriptions are processed by our Merchant of
                        Record. Checkout collects the email address needed to send your
                        receipt and license key (or activation link). We do not store your
                        payment card information.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        License delivery
                    </h2>
                    <p className="mb-4">
                        After payment, we email your license key and receipt to the address
                        you provide at checkout. Please keep that email for your records.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        License recovery
                    </h2>
                    <p className="mb-4">
                        If you lose your license, we can resend it to the original purchase
                        email after verifying the request.
                    </p>

                    <h2 className="font-display text-2xl font-bold mt-8 mb-3 text-warm-gray-800">
                        Refunds
                    </h2>
                    <p className="mb-4">
                        Refunds are provided at the sole discretion of visionite gmbh or its
                        Merchant of Record and on a case-by-case basis and may be refused.
                        We will refuse a refund request if we find evidence of fraud, refund
                        abuse, or other manipulative behaviour that entitles us to
                        counterclaim the refund.
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
                        have the right to cancel this Agreement and return the Product
                        within 14 days without giving any reason. The cancellation period
                        will expire after 14 days from the day after completion of the
                        Transaction. To meet the cancellation deadline, it is sufficient
                        that you send us your communication concerning your exercise of the
                        cancellation right before the expiration of the 14 day period.
                    </p>

                    <p className="mb-4">
                        To cancel your order, you must inform visionite gmbh or its assigned
                        Merchant of Record of your decision. To ensure immediate processing,
                        please do so by contacting us here. Please note that in respect of
                        subscription services your right to cancel is only present following
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
        </div>
    );
}
