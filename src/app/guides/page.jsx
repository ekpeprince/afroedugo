import React from 'react';
import Link from 'next/link';
import { getAllGuides } from '../../utils/guides';

export const metadata = {
  title: 'International Student Guides & Visa Resources | AfroEduGo',
  description: 'Verified guides on studying, working, finding student accommodation, opening bank accounts, and visas for African students in Europe.',
  alternates: {
    canonical: 'https://afroedugo.com/guides',
  },
  openGraph: {
    title: 'International Student Guides & Visa Resources | AfroEduGo',
    description: 'Verified guides on studying, working, finding student accommodation, opening bank accounts, and visas for African students in Europe.',
    url: 'https://afroedugo.com/guides',
    type: 'website',
  },
};

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 font-sans text-gray-900 dark:text-white transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-gray-900 dark:text-white tracking-tight">
            AfroEdugo <span className="text-primary font-black">Guides</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/community"
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Community
            </Link>
            <Link
              href="/schools"
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Schools
            </Link>
            <Link
              href="/"
              className="text-xs font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <span className="inline-block px-3.5 py-1 bg-primary/10 text-primary dark:text-primary-light text-xs font-black uppercase tracking-widest rounded-full mb-4">
          📚 Verified Student Knowledge Base
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-4">
          Everything You Need to Study, Live, & Thrive Abroad
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Practical, actionable step-by-step guides written specifically for African and international students moving to Lithuania and Europe.
        </p>
      </section>

      {/* Guides Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        {guides.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <span className="text-4xl mb-3 block">📖</span>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">No Guides Published Yet</h3>
            <p className="text-xs text-gray-500">Check back soon for new articles!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
            {guides.map((guide) => (
              <article
                key={guide.slug}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-150 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl p-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl block">
                      {guide.data.coverEmoji || '📄'}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                      {guide.data.readTime}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {guide.data.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/5 text-primary dark:text-primary-light"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors line-clamp-2 leading-snug">
                    {guide.data.title}
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed font-normal">
                    {guide.data.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {guide.data.date}
                  </span>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-xs font-bold text-primary dark:text-primary-light group-hover:translate-x-0.5 transition-transform flex items-center gap-1"
                  >
                    Read Guide →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Community Callout Banner */}
        <div className="mt-16 bg-gradient-to-r from-primary to-primary-light text-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Have a specific question?</h3>
            <p className="text-white/80 text-sm max-w-md">
              Ask hundreds of current African students and international alumni on our interactive community forum.
            </p>
          </div>
          <Link
            href="/community"
            className="bg-white text-primary hover:bg-sand font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            Join the Community
          </Link>
        </div>
      </main>
    </div>
  );
}
