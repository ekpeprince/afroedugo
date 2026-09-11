import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | AfroEduGo',
  description: 'AfroEduGo Terms of Service. Review the conditions and rules for using the AfroEduGo platform.',
  alternates: {
    canonical: 'https://afroedugo.com/terms',
  },
};

export default function TermsPage() {
  const lastUpdated = "September 11, 2026";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* ── TOP NAVIGATION ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-black tracking-tighter text-gray-900 group-hover:text-primary transition-colors">
              AfroEdu<span className="text-primary">Go</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
              Privacy Policy
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
            Legal Terms
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-medium">
            Last Updated: <span className="font-semibold text-gray-700">{lastUpdated}</span>
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 pt-10">
        <article className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using AfroEduGo (&quot;the Platform,&quot; &quot;we,&quot; &quot;us&quot;), available at{' '}
              <a href="https://afroedugo.com" className="text-[#065F46] font-bold underline">
                https://afroedugo.com
              </a>, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              2. Platform Purpose & Services
            </h2>
            <p>
              AfroEduGo provides an informational discovery and connection portal for students seeking international higher education, verified student housing options, community networking, and student support services.
            </p>
            <p>
              While we strive to verify listings, institutional admissions decisions and housing lease contracts remain agreements strictly between the student and the respective university or landlord.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              3. User Accounts & Responsibilities
            </h2>
            <p>
              When creating an account via email or Google Sign-In, you agree to provide accurate and authentic information. You are responsible for safeguarding your login credentials and for any actions taken under your account.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              4. Community Conduct
            </h2>
            <p>
              AfroEduGo values a supportive, respectful environment. Users shall not post misleading information, fraudulent advertisements, harassment, or abusive content in community forums. Violations may result in account termination.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              5. Privacy & Data Use
            </h2>
            <p>
              Your privacy is governed by our{' '}
              <Link href="/privacy" className="text-[#065F46] font-bold underline">
                Privacy Policy
              </Link>. By using our platform, you agree to the collection and use of information in accordance with that policy.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              6. Contact Us
            </h2>
            <p>
              For legal inquiries regarding these Terms, contact us at{' '}
              <a href="mailto:contact@afroedugo.com" className="text-[#065F46] font-bold underline">
                contact@afroedugo.com
              </a>.
            </p>
          </section>
        </article>

        <div className="mt-14 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#065F46] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/20"
          >
            ← Back to AfroEduGo
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
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
