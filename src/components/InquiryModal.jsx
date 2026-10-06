'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { getWhatsAppLink } from '../utils/whatsapp';

const InquiryModal = ({ isOpen, onClose, item, type = 'school', onSuccess }) => {
  const { user } = useAuth();

  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [educationLevel, setEducationLevel] = useState("Bachelor's");
  const [intake, setIntake] = useState('Autumn 2027');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      if (user.displayName) setStudentName(user.displayName);
      else if (user.email) setStudentName(user.email.split('@')[0]);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  if (!isOpen || !item) return null;

  const isSchool = type === 'school';
  const courses = Array.isArray(item?.courses)
    ? item.courses.map((c) => (typeof c === 'string' ? c : c.name || '')).filter(Boolean)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSchool) {
        const payload = {
          studentName: studentName.trim() || (user?.displayName || user?.email?.split('@')[0] || 'Prospective Student'),
          email: email.trim() || user?.email || '',
          phone: phone.trim(),
          educationLevel,
          intake,
          selectedProgram: selectedProgram.trim() || 'General Admission / Undecided',
          schoolId: item.id || '',
          schoolName: item.name || item.title || '',
          schoolCountry: item.country || 'Lithuania',
          estimatedTuition: item.tuition || '',
          tuition: item.tuition || '',
          type: 'advisory',
          notes: message.trim() || 'Chat with Advisor requested.',
          userId: user?.uid || null,
          submissionTimestamp: new Date().toISOString(),
        };

        const res = await fetch('/api/schools/inquire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit inquiry');
        }

        // Optional non-blocking client-side Firestore backup for authenticated users
        if (user) {
          try {
            await addDoc(collection(db, 'leads'), {
              userId: user.uid,
              userEmail: user.email,
              studentName: payload.studentName,
              itemId: item.id,
              itemTitle: item.name || item.title,
              itemType: 'school',
              schoolId: item.id,
              schoolName: item.name || item.title,
              schoolCountry: item.country || 'Lithuania',
              phone: payload.phone,
              educationLevel,
              intake,
              selectedProgram: payload.selectedProgram,
              message: message.trim(),
              status: 'new',
              createdAt: serverTimestamp(),
            });
          } catch (clientErr) {
            console.warn('Client-side Firestore leads write note:', clientErr);
          }
        }

        const successText = data.message || 'Inquiry Sent! An advisor will reach out via WhatsApp/Email within 24 hours';
        if (onSuccess) {
          onSuccess(successText);
        }

        onClose();
      } else {
        // Housing or other item inquiry
        if (user) {
          await addDoc(collection(db, 'leads'), {
            userId: user.uid,
            userEmail: user.email,
            studentName: studentName.trim() || user.email.split('@')[0],
            itemId: item.id,
            itemTitle: item.name || item.title,
            itemType: type,
            message: message.trim(),
            phone: phone.trim(),
            status: 'new',
            createdAt: serverTimestamp(),
          });
        }

        const waText = `*New Inquiry via AfroEduGo*\n\n*Item:* ${item.name || item.title}\n*Type:* ${type}\n*Message:* ${message}\n*Student Phone:* ${phone}\n*Student Email:* ${email || user?.email || ''}`;
        const waUrl = getWhatsAppLink('', waText);
        window.location.href = waUrl;

        if (onSuccess) {
          onSuccess('Inquiry Sent! An advisor will reach out via WhatsApp/Email within 24 hours');
        }
        onClose();
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setErrorMsg(err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none mb-1.5">
              {isSchool ? 'Chat with Advisor' : 'Request Info'}
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
              Regarding: {item.name || item.title}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
              Full Name *
            </label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Amara Okafor"
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
              Email Address *
            </label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
              />
            </div>
          </div>

          {/* WhatsApp / Phone Number */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
              WhatsApp / Phone Number *
            </label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
              />
            </div>
          </div>

          {isSchool && (
            <>
              {/* Education Level & Target Intake row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                    Current Education Level *
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold text-sm"
                    >
                      <option value="High School">High School</option>
                      <option value="Bachelor's">Bachelor's Degree</option>
                      <option value="Master's">Master's Degree</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                    Target Intake *
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
                    <select
                      value={intake}
                      onChange={(e) => setIntake(e.target.value)}
                      className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold text-sm"
                    >
                      <option value="Autumn 2027">Autumn 2027</option>
                      <option value="Spring 2028">Spring 2028</option>
                      <option value="Autumn 2028">Autumn 2028</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferred Program / Degree */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                  Preferred Program / Degree
                </label>
                <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
                  {courses.length > 0 ? (
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold text-sm"
                    >
                      <option value="">Select a Program (or choose Other)</option>
                      {courses.map((courseName, idx) => (
                        <option key={idx} value={courseName}>{courseName}</option>
                      ))}
                      <option value="General Admission / Other">Other / Undecided</option>
                    </select>
                  ) : (
                    <input 
                      type="text"
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      placeholder="e.g. BSc Computer Science, Nursing, MBA"
                      className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Quick Message / Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
              Questions or Notes for Advisor
            </label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isSchool 
                  ? "Tell us about your background, desired specialization, or questions regarding visas and tuition..." 
                  : "I would like to know about the availability and viewing schedule..."
                }
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-medium placeholder:text-gray-300 resize-none text-sm"
                rows="3"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-primary text-white py-4.5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Connect with Advisor</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
          
          <p className="text-center text-[10px] text-gray-400 font-semibold leading-relaxed">
            Instant confirmation & guidance roadmap will be sent to your email. An advisor will reach out via WhatsApp/Email within 24 hours.
          </p>
        </form>
      </div>
    </div>
  );
};

export default InquiryModal;
