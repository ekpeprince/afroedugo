import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getGuideBySlug, getGuideSlugs, getAllGuides } from '../../../utils/guides';

// Custom beautifully styled components for MDX rendering
const mdxComponents = {
  h1: (props) => <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-10 mb-5 leading-tight tracking-tight" {...props} />,
  h2: (props) => <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-10 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800 leading-snug tracking-tight" {...props} />,
  h3: (props) => <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-7 mb-3 leading-snug" {...props} />,
  p: (props) => <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-6 font-normal" {...props} />,
  ul: (props) => <ul className="list-disc pl-6 mb-6 space-y-2.5 text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 mb-6 space-y-2.5 text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  strong: (props) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
  a: (props) => <a className="text-primary dark:text-primary-light font-bold underline decoration-primary/30 hover:decoration-primary transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-primary pl-5 py-2 my-6 bg-primary/5 rounded-r-2xl italic text-gray-800 dark:text-gray-200" {...props} />
  ),
  hr: () => <hr className="my-10 border-gray-200 dark:border-gray-800" />,
  code: (props) => <code className="bg-gray-100 dark:bg-gray-800 text-primary-dark dark:text-primary-light px-2 py-0.5 rounded-lg text-sm font-mono" {...props} />,
};

// 1. Dynamic SEO Metadata Generation for Google & Social Crawlers
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const guide = getGuideBySlug(resolvedParams.slug);
  if (!guide) return {};

  const baseUrl = 'https://afroedugo.com';
  const url = `${baseUrl}/guides/${guide.slug}`;

  return {
    title: `${guide.data.title} | AfroEduGo`,
    description: guide.data.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: guide.data.title,
      description: guide.data.description,
      url,
      type: 'article',
      publishedTime: guide.data.date,
      authors: [guide.data.author || 'AfroEduGo'],
      tags: guide.data.tags,
      siteName: 'AfroEduGo',
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.data.title,
      description: guide.data.description,
    },
  };
}

// 2. Static Generation for Lightning Fast Crawling
export async function generateStaticParams() {
  const slugs = getGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

// 3. Page Component
export default async function GuidePage({ params }) {
  const resolvedParams = await params;
  const guide = getGuideBySlug(resolvedParams.slug);

  if (!guide) {
    notFound();
  }

  const allGuides = getAllGuides();
  const relatedGuides = allGuides.filter((g) => g.slug !== guide.slug).slice(0, 2);

  // Structured Data (Schema.org Article JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.data.title,
    description: guide.data.description,
    datePublished: guide.data.date,
    author: {
      '@type': 'Organization',
      name: guide.data.author || 'AfroEduGo',
      url: 'https://afroedugo.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AfroEduGo',
      url: 'https://afroedugo.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://afroedugo.com/guides/${guide.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 font-sans text-gray-900 dark:text-white transition-colors duration-300 selection:bg-primary/20">
      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/guides"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>All Guides</span>
          </Link>

          <Link href="/" className="font-black text-lg text-gray-900 dark:text-white tracking-tight">
            AfroEdugo <span className="text-primary font-black">Guides</span>
          </Link>

          <Link
            href="/community"
            className="text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light px-3.5 py-1.5 rounded-full transition-colors"
          >
            Ask Community
          </Link>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Article Header */}
        <div className="mb-10 pb-8 border-b border-gray-200/60 dark:border-gray-800">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {guide.data.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary/10 text-primary dark:text-primary-light text-xs font-bold uppercase tracking-wider rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] mb-5 text-gray-900 dark:text-white">
            {guide.data.title}
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-normal mb-6">
            {guide.data.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-200">
              <span className="text-base">✍️</span> {guide.data.author}
            </span>
            <span>•</span>
            <span>📅 {guide.data.date}</span>
            <span>•</span>
            <span>⏱️ {guide.data.readTime}</span>
          </div>
        </div>

        {/* MDX Body Content */}
        <article className="max-w-none">
          <MDXRemote source={guide.content} components={mdxComponents} />
        </article>

        {/* Author Bio Card */}
        <div className="mt-16 p-6 sm:p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white text-3xl flex items-center justify-center shrink-0 shadow-md">
            🎓
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Written by the AfroEduGo Advisory Team</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Curated by international alumni and student advisors to help African scholars navigate admissions, visas, accommodation, and work abroad with ease.
            </p>
          </div>
          <Link
            href="/community"
            className="shrink-0 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Connect with Students
          </Link>
        </div>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Related Student Guides
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedGuides.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/guides/${rel.slug}`}
                  className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-primary/50 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-2xl block mb-2">{rel.data.coverEmoji || '📄'}</span>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {rel.data.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {rel.data.description}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary dark:text-primary-light mt-4 flex items-center gap-1">
                    Read guide →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
