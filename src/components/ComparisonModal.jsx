import React from 'react';
import SmartImage from './SmartImage';

const ComparisonModal = ({ isOpen, onClose, schools }) => {
  if (!isOpen || schools.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Compare Schools</h2>
            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Side-by-side analysis</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Row Headers */}
            <div className="hidden md:flex flex-col gap-4 font-bold text-gray-400 text-xs uppercase tracking-wider justify-start pt-48">
              <div className="py-3 border-b border-gray-50">Location</div>
              <div className="py-3 border-b border-gray-50">Tuition Fee</div>
              <div className="py-3 border-b border-gray-50">Language</div>
              <div className="py-3 border-b border-gray-50">Fall Deadline</div>
              <div className="py-3 border-b border-gray-50">Spring Deadline</div>
              <div className="py-3 border-b border-gray-50">Top Courses</div>
            </div>

            {/* School Columns */}
            {schools.map((school) => (
              <div key={school.id} className="flex flex-col gap-4">
                <div className="h-44 relative rounded-xl overflow-hidden mb-2 shadow-sm">
                  <SmartImage src={school.imageUrl || school.galleryImages?.[0]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h3 className="absolute bottom-3 left-3 right-3 font-bold text-white text-sm leading-tight drop-shadow-md">
                    {school.name}
                  </h3>
                </div>

                <div className="md:hidden font-bold text-[10px] text-gray-400 uppercase tracking-widest -mb-2">Location</div>
                <div className="py-3 border-b border-gray-50 text-sm font-bold text-gray-900 flex items-center gap-1">
                  <span className="text-xl">📍</span> {school.location}
                </div>

                <div className="md:hidden font-bold text-[10px] text-gray-400 uppercase tracking-widest -mb-2">Tuition Fee</div>
                <div className="py-3 border-b border-gray-50 text-sm font-black text-primary">
                  {school.tuition || `€${school.tuitionFee}/year`}
                </div>

                <div className="md:hidden font-bold text-[10px] text-gray-400 uppercase tracking-widest -mb-2">Language</div>
                <div className="py-3 border-b border-gray-50 text-sm font-bold text-gray-700">
                  {school.language || 'English'}
                </div>

                <div className="md:hidden font-bold text-[10px] text-gray-400 uppercase tracking-widest -mb-2">Fall Deadline</div>
                <div className="py-3 border-b border-gray-50 text-sm font-bold text-gray-700">
                  {school.deadlines?.fall || 'June 1st'}
                </div>

                <div className="md:hidden font-bold text-[10px] text-gray-400 uppercase tracking-widest -mb-2">Spring Deadline</div>
                <div className="py-3 border-b border-gray-50 text-sm font-bold text-gray-700">
                  {school.deadlines?.spring || 'November 1st'}
                </div>

                <div className="md:hidden font-bold text-[10px] text-gray-400 uppercase tracking-widest -mb-2">Top Courses</div>
                <div className="py-3 border-b border-gray-50 text-xs font-medium text-gray-600">
                  <ul className="list-disc pl-4 space-y-1">
                    {school.courses?.slice(0, 4).map((c, i) => <li key={i}>{c.name || c}</li>) || 'Various degree programs'}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
