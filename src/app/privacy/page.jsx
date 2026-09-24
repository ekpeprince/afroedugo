import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | AfroEduGo',
  description: 'AfroEduGo Privacy Policy. Learn how we collect, use, protect, and handle your data when using our global student platform.',
  alternates: {
    canonical: 'https://afroedugo.com/privacy',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 11, 2026";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* ── TOP NAVIGATION ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-black tracking-tighter text-gray-900 leading-none transition-colors duration-300 group-hover:text-primary">
              AfroEduGo
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/auth" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-emerald-50/60 via-[#FAFAFA] to-[#FAFAFA] pt-12 pb-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100/70 text-[#065F46] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-[#065F46] animate-pulse"></span>
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-medium">
            Last Updated: <span className="font-semibold text-gray-700">{lastUpdated}</span>
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 pt-10">
        {/* Quick Highlights Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-xl shadow-emerald-950/5 mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#065F46] mb-4">
            Key Privacy Guarantees
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100">
              <span className="text-2xl mb-2 block">🚫</span>
              <h3 className="font-black text-sm text-gray-900 mb-1">No Data Selling</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                We never sell, rent, or trade your personal information to third-party brokers or advertisers.
              </p>
            </div>
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100">
              <span className="text-2xl mb-2 block">🔒</span>
              <h3 className="font-black text-sm text-gray-900 mb-1">Secure Authentication</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Google Sign-In data is used solely to authenticate your identity and personalize your profile.
              </p>
            </div>
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100">
              <span className="text-2xl mb-2 block">🗑️</span>
              <h3 className="font-black text-sm text-gray-900 mb-1">Full User Control</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                You can review, export, or permanently delete your account and personal data at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <article className="space-y-10 text-gray-700 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              1. Introduction & Overview
            </h2>
            <p>
              Welcome to <strong>AfroEduGo</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), accessible at{' '}
              <a href="https://afroedugo.com" className="text-[#065F46] font-bold underline hover:text-emerald-700">
                https://afroedugo.com
              </a>.
              AfroEduGo is an all-in-one global educational hub designed to help prospective and international students discover verified universities, locate reliable student accommodations, connect with peer communities, and access student advisory services.
            </p>
            <p>
              We respect your privacy and are committed to safeguarding your personal data. This Privacy Policy outlines our practices regarding data collection, usage, storage, and your individual privacy rights.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              2. Information We Collect
            </h2>
            <p>
              We only collect information that is strictly necessary to provide and enhance our services:
            </p>
            <div className="space-y-3 pl-2">
              <div className="border-l-2 border-[#065F46] pl-4">
                <h4 className="font-bold text-gray-900">A. Information You Voluntarily Provide</h4>
                <p className="text-sm text-gray-600">
                  When you register, submit an inquiry for a university or housing listing, post in student community discussions, or request assistance, we may collect your name, email address, telephone/WhatsApp number, field of study preferences, and message content.
                </p>
              </div>

              <div className="border-l-2 border-[#065F46] pl-4">
                <h4 className="font-bold text-gray-900">B. Information From Google Sign-In & Third-Party Providers</h4>
                <p className="text-sm text-gray-600">
                  When you choose to sign in using <strong>Google Sign-In</strong> (or other OAuth providers), we request access to basic public profile details authorized by you:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                  <li>Your primary Google account email address</li>
                  <li>Your display name (first and last name)</li>
                  <li>Your Google account profile photo/avatar</li>
                </ul>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Note: We never access your Google password, Google Drive, contacts, or any unauthorized Google data.
                </p>
              </div>

              <div className="border-l-2 border-[#065F46] pl-4">
                <h4 className="font-bold text-gray-900">C. Technical & Usage Information</h4>
                <p className="text-sm text-gray-600">
                  Like most modern web applications, we may collect non-identifying technical information such as device type, browser information, pages viewed, and approximate geographic location to ensure optimal performance and security.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              3. How We Use Your Information
            </h2>
            <p>We utilize the collected information strictly for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li><strong>Authentication & Security:</strong> To create your user account, verify your identity, and safeguard against unauthorized access.</li>
              <li><strong>Saved Preferences:</strong> To let you bookmark and manage shortlisted universities, scholarship searches, and favorite housing units.</li>
              <li><strong>Inquiry Transmission:</strong> When you submit a request for accommodation or school admission assistance, your contact details are shared directly with the authorized school rep, housing manager, or verified advisor you requested.</li>
              <li><strong>Notifications & Updates:</strong> To send account confirmations, application status notifications, or important platform notices.</li>
              <li><strong>Service Improvement:</strong> To resolve technical issues and enhance platform navigation and performance.</li>
            </ul>
          </section>

          {/* Section 4 - GOOGLE API LIMITED USE DISCLOSURE */}
          <section className="bg-emerald-50/50 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-200/60 text-[#065F46] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Google API Compliance
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              4. Google API Services User Data Policy Compliance
            </h2>
            <p className="font-medium text-gray-800">
              AfroEduGo adheres strictly to Google&apos;s API Services User Data Policy.
            </p>
            <blockquote className="bg-white p-4 rounded-2xl border-l-4 border-[#065F46] text-gray-800 font-semibold text-xs sm:text-sm my-3 shadow-sm">
              &quot;AfroEduGo&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#065F46] underline hover:text-emerald-800"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.&quot;
            </blockquote>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>We <strong>do not</strong> use Google user data to train generalized artificial intelligence or machine learning models.</li>
              <li>We <strong>do not</strong> sell Google user data to any external parties, data brokers, or advertising networks.</li>
              <li>We <strong>do not</strong> use or transfer Google user data for serving personalized, retargeted, or interest-based advertising.</li>
            </ul>
          </section>

          {/* Section 5 - DATA PROTECTION & SHARING */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              5. Data Sharing & Third Parties
            </h2>
            <p className="font-bold text-gray-900">
              We do not sell, rent, or trade your personal data.
            </p>
            <p className="text-sm text-gray-600">
              Your data is only disclosed under the following controlled conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>
                <strong>Direct User Requests:</strong> When you voluntarily submit an inquiry form for housing or university admissions, your specified contact information (e.g., name, email, WhatsApp) is transmitted to the respective verified listing owner or provider.
              </li>
              <li>
                <strong>Trusted Infrastructure Providers:</strong> We employ trusted cloud infrastructure providers (such as Google Firebase for secure database and authentication storage, and Vercel for web hosting). These providers are bound by strict confidentiality and data protection obligations.
              </li>
              <li>
                <strong>Legal Compliance:</strong> If required by valid court order, law enforcement, or applicable regulatory statute.
              </li>
            </ul>
          </section>

          {/* Section 6 - SECURITY & STORAGE */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              6. Data Security & Storage
            </h2>
            <p className="text-sm text-gray-600">
              We implement industry-standard administrative, technical, and physical safeguards to protect your personal data against unauthorized access, loss, or alteration. All communication between your device and AfroEduGo is encrypted using modern <strong>SSL/TLS (HTTPS)</strong> protocols.
            </p>
          </section>

          {/* Section 7 - USER RIGHTS & DATA DELETION */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              7. Your Rights & Data Deletion
            </h2>
            <p className="text-sm text-gray-600">
              You maintain full control over your personal data. You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
              <li>Access the personal information we hold about you.</li>
              <li>Correct inaccurate or incomplete profile details.</li>
              <li>Request the complete deletion of your account and associated data.</li>
              <li>Revoke Google Sign-In access at any time via your{' '}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#065F46] underline font-bold"
                >
                  Google Account Permissions
                </a>.
              </li>
            </ul>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs text-gray-600">
              <strong>How to request data deletion:</strong> To permanently delete your profile, saved listings, and inquiry history, navigate to your Profile settings in the app or email us directly at{' '}
              <a href="mailto:privacy@afroedugo.com" className="text-[#065F46] font-bold underline">
                privacy@afroedugo.com
              </a>{' '}
              with the subject line &quot;Delete My Account&quot;. Deletion requests are fulfilled within 30 days.
            </div>
          </section>

          {/* Section 8 - CONTACT US */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              8. Contact Information
            </h2>
            <p className="text-sm text-gray-600">
              If you have any questions, concerns, or inquiries regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-1 text-sm text-gray-800 font-medium">
              <p><strong>App:</strong> AfroEduGo (<a href="https://afroedugo.com" className="text-[#065F46] underline">https://afroedugo.com</a>)</p>
              <p><strong>Email:</strong> <a href="mailto:privacy@afroedugo.com" className="text-[#065F46] underline">privacy@afroedugo.com</a> / <a href="mailto:contact@afroedugo.com" className="text-[#065F46] underline">contact@afroedugo.com</a></p>
              <p><strong>Location:</strong> Global Education Support Desk</p>
            </div>
          </section>
        </article>

        {/* ── BACK BUTTON & FOOTER NAVIGATION ────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#065F46] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/20"
          >
            ← Back to AfroEduGo
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/auth" className="hover:text-primary transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
