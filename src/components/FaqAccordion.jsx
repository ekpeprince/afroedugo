'use client';

import React, { useState } from 'react';

export default function FaqAccordion({ faqs = [] }) {
  const [openIndices, setOpenIndices] = useState([0]); // First FAQ open by default

  if (!faqs || faqs.length === 0) return null;

  const toggle = (idx) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section className="mt-14 pt-10 border-t border-gray-200/80 dark:border-gray-800" aria-label="Frequently Asked Questions">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary dark:text-primary-light flex items-center justify-center text-lg font-black shrink-0">
          ❓
        </span>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Key insights & answers verified by AfroEduGo admissions advisors
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-primary/40 bg-white dark:bg-gray-900 shadow-sm'
                  : 'border-gray-200/70 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-gray-900 dark:text-white select-none group"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base group-hover:text-primary transition-colors leading-snug">
                  {faq.question}
                </span>
                <span
                  className={`w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-500 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-primary bg-primary/10' : ''
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out px-5 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal ${
                  isOpen ? 'pb-5 pt-1 opacity-100 max-h-96' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                {faq.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
