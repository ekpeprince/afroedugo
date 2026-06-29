'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SmartImage from '../../../components/SmartImage';
import InquiryModal from '../../../components/InquiryModal';
import { getWhatsAppLink } from '../../../utils/whatsapp';
import { useAuth } from '../../../hooks/useAuth';

export default function SchoolDetailClient({ school }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const handleEnrollClick = () => {
    if (!user) {
      alert("Please login to enroll or send inquiries!");
      router.push('/auth');
      return;
    }
    setIsInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative pb-32">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/40 backdrop-blur-2xl z-30 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <button 
          onClick={() => router.push('/schools')} 
          className="text-2xl hover:text-primary transition-colors"
        >
          ←
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Institution Details</h2>
        <div className="w-6"></div> {/* Spacer to center the title */}
      </header>

      {/* Hero Banner Image */}
      <div className="relative h-80 md:h-[450px] w-full pt-16">
        <SmartImage 
          src={school.imageUrl} 
          alt={school.name} 
          className="h-full w-full rounded-b-[3rem] shadow-xl"
          type="school"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-b-[3rem]"></div>
        
        {/* Title overlay */}
        <div className="absolute bottom-8 left-6 right-6 text-white z-10">
          <span className="bg-primary text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
            Verified Partner
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{school.name}</h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        {/* Main Details column */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-wider text-xs text-primary">About the University</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              {school.description || `${school.name} is a premier educational institution located in ${school.location}, ${school.country}. Offering internationally recognized degrees and programs, it serves as a gateway for African students to access high-quality European education, career opportunities, and direct integration paths.`}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wider text-xs text-primary">Admission Requirements</h3>
            {school.admissionReqs && school.admissionReqs.length > 0 ? (
              <ul className="space-y-3">
                {school.admissionReqs.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary p-1.5 rounded-lg text-[10px] mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    </span>
                    <span className="text-gray-700 font-bold text-sm leading-tight pt-1">{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 font-medium text-sm">Please contact the admissions team for specific requirements.</p>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wider text-xs text-primary">Offered Degree Programs</h3>
            {school.courses && school.courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {school.courses.map((course) => (
                  <div key={course} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="text-primary font-bold">✓</span>
                    <span className="text-gray-700 font-bold text-sm">{course}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 font-medium text-sm">Please contact the admissions team for active degree paths.</p>
            )}
          </div>

          {school.galleryImages && school.galleryImages.length > 0 && (
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wider text-xs text-primary">Campus Gallery</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {school.galleryImages.map((img, idx) => (
                  <div key={idx} className="h-48 rounded-xl overflow-hidden">
                    <SmartImage src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Fee / Action column */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 text-center flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Estimated Tuition</span>
            <span className="text-3xl font-black text-gray-900 mb-6">{school.tuition}</span>

            <div className="w-full space-y-3">
              <button
                onClick={handleEnrollClick}
                className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                🎓 Enroll Now
              </button>

              <a
                href={getWhatsAppLink(school.whatsapp || '+37060123456', `Hi, I am interested in applying to ${school.name}. Please guide me on the next steps!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
              >
                💬 Chat with Advisor
              </a>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pb-3 border-b border-gray-50">
              <span className="text-lg">📍</span>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">Location</p>
                <p className="text-gray-800 leading-none">{school.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pb-3 border-b border-gray-50">
              <span className="text-lg">🌍</span>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">Country</p>
                <p className="text-gray-800 leading-none">{school.country}</p>
              </div>
            </div>
            {school.studentBody && (
              <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pb-3 border-b border-gray-50">
                <span className="text-lg">👥</span>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Student Body</p>
                  <p className="text-gray-800 leading-none">{school.studentBody}</p>
                </div>
              </div>
            )}
            {school.language && (
              <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pb-3 border-b border-gray-50">
                <span className="text-lg">🗣️</span>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Language of Instruction</p>
                  <p className="text-gray-800 leading-none">{school.language}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pb-3 border-b border-gray-50">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">Fall Deadline</p>
                <p className="text-gray-800 leading-none">{school.deadlines?.fall || 'June 1st'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pb-3 border-b border-gray-50">
              <span className="text-lg">🌱</span>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">Spring Deadline</p>
                <p className="text-gray-800 leading-none">{school.deadlines?.spring || 'November 1st'}</p>
              </div>
            </div>
            {school.website && (
              <div className="flex items-center gap-3 text-gray-500 font-bold text-sm pt-1">
                <span className="text-lg">🌐</span>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Official Website</p>
                  <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline leading-none">
                    Visit Website
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admission Inquiry Modal */}
      <InquiryModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        item={school} 
        type="school" 
      />
    </div>
  );
}
