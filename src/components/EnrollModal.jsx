'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { getWhatsAppLink } from '../utils/whatsapp';
import { validateFile, ALLOWED_DOCUMENT_TYPES } from '../utils/fileSecurity';
import { logger } from '../utils/logger';

const EnrollModal = ({ isOpen, onClose, school, onSuccess }) => {
  const { user } = useAuth();

  const [studentName, setStudentName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [educationLevel, setEducationLevel] = useState("Bachelor's");
  const [intake, setIntake] = useState('Autumn 2027');
  const [program, setProgram] = useState('');
  const [course, setCourse] = useState('');
  const [academicDocs, setAcademicDocs] = useState([]);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      if (user.displayName) setStudentName(user.displayName);
      else if (user.email) setStudentName(user.email.split('@')[0]);
      if (user.email) setContactEmail(user.email);
    }
  }, [user]);

  if (!isOpen || !school) return null;

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const check = validateFile(file, { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_DOCUMENT_TYPES, label: 'Passport document' });
      if (!check.valid) {
        alert(check.error);
        return;
      }
      setter(file);
    }
  };

  const handleMultipleFilesChange = (e, setter) => {
    if (e.target.files) {
      const raw = Array.from(e.target.files);
      const valid = raw.filter(file => {
        const check = validateFile(file, { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_DOCUMENT_TYPES, label: 'Academic document' });
        if (!check.valid) {
          alert(check.error);
          return false;
        }
        return true;
      });
      setter(valid);
    }
  };

  const uploadFile = async (file, type) => {
    if (!file || !user) return null;
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '') : 'document.pdf';
    const storageRef = ref(storage, `enrollments/${user.uid}_${Date.now()}_${type}_${safeName}`);
    await uploadBytes(storageRef, file, { contentType: file.type || 'application/pdf' });
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let academicDocUrls = [];
      let passportUrl = null;

      if (user) {
        for (const file of academicDocs) {
          const url = await uploadFile(file, 'academic');
          if (url) academicDocUrls.push(url);
        }
        if (passport) {
          passportUrl = await uploadFile(passport, 'passport');
        }
      }

      const selectedProgramName = [program, course].filter(Boolean).join(' - ') || 'Undergraduate Degree Program';

      // 1. Dispatch through automated institutional inquiry & dual-email pipeline
      const payload = {
        studentName: studentName.trim() || (user?.displayName || user?.email?.split('@')[0] || 'Prospective Student'),
        email: contactEmail.trim() || user?.email || '',
        phone: phone.trim(),
        educationLevel,
        intake,
        selectedProgram: selectedProgramName,
        schoolId: school.id,
        schoolName: school.name,
        schoolCountry: school.country || 'Lithuania',
        tuition: school.tuition || '',
        estimatedTuition: school.tuition || '',
        type: 'enrollment',
        notes: `Application Program: ${program || 'Not specified'}, Course: ${course || 'Not specified'}. Uploaded documents: ${academicDocUrls.length} academic files, ${passportUrl ? 'passport attached' : 'passport pending'}.`,
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
        throw new Error(data.error || 'Failed to submit enrollment application');
      }

      // 2. Also log to Firestore enrollments collection for authenticated users
      if (user) {
        try {
          await addDoc(collection(db, 'enrollments'), {
            userId: user.uid,
            userEmail: user.email,
            contactEmail: payload.email,
            studentName: payload.studentName,
            schoolId: school.id,
            schoolName: school.name,
            program: program || 'Degree',
            course: course || 'Major',
            phone: payload.phone,
            academicDocUrls,
            passportUrl,
            educationLevel,
            intake,
            status: 'pending',
            createdAt: serverTimestamp(),
          });
        } catch (enrErr) {
          console.warn('Enrollment doc Firestore backup warning:', enrErr);
        }
      }

      const successMsg = data.message || 'Inquiry Sent! An advisor will reach out via WhatsApp/Email within 24 hours';
      if (onSuccess) {
        onSuccess(successMsg);
      }

      onClose();
    } catch (error) {
      console.error("Error submitting enrollment:", error);
      setErrorMsg(error.message || 'Failed to submit enrollment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const programs = ['BSc', 'MSc', 'PhD', 'Others'];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto mt-20 sm:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none mb-1.5">Enroll Now</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">School: {school.name}</p>
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
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Full Name *</label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Kwame Mensah"
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
              />
            </div>
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email Address *</label>
              <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
                <input 
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">WhatsApp / Phone *</label>
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
          </div>

          {/* Education Level & Target Intake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Education Level *</label>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Target Intake *</label>
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

          {/* Program & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Program Level</label>
              <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
                <select 
                  required
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold text-sm"
                >
                  <option value="" disabled>Select Program</option>
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Course of Interest</label>
              <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
                {school.courses && school.courses.length > 0 ? (
                  <select 
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold text-sm"
                  >
                    <option value="" disabled>Select Course</option>
                    {school.courses.map(c => {
                      const cName = c.name || c;
                      return <option key={cName} value={cName}>{cName}</option>;
                    })}
                  </select>
                ) : (
                  <input 
                    required
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300 text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Upload Documents (Optional for initial inquiry) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
              Academic Transcripts / Certificates (Optional)
            </label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleMultipleFilesChange(e, setAcademicDocs)}
                className="w-full bg-transparent p-2 outline-none text-gray-600 font-medium text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
              />
              {academicDocs.length > 0 && (
                <div className="px-3 pb-2 text-[10px] font-bold text-primary">
                  {academicDocs.length} file(s) selected
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
              International Passport Data Page (Optional)
            </label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, setPassport)}
                className="w-full bg-transparent p-2 outline-none text-gray-600 font-medium text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white py-4.5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Enrollment Application</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14m-7-7 7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
          
          <p className="text-center text-[10px] text-gray-400 font-semibold leading-relaxed">
            By submitting, your inquiry is logged with AfroEduGo Admissions. You will receive an instant confirmation email and direct advisor support.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EnrollModal;
