import React, { useState } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { getWhatsAppLink } from '../utils/whatsapp';

const EnrollModal = ({ isOpen, onClose, school }) => {
  const { user } = useAuth();
  
  const [academicDocs, setAcademicDocs] = useState([]);
  const [passport, setPassport] = useState(null);
  const [program, setProgram] = useState('');
  const [course, setCourse] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e, setter) => {
    if (e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleMultipleFilesChange = (e, setter) => {
    if (e.target.files) {
      setter(Array.from(e.target.files));
    }
  };

  const uploadFile = async (file, type) => {
    if (!file) return null;
    const storageRef = ref(storage, `enrollments/${user.uid}_${Date.now()}_${type}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to enroll");
      return;
    }
    
    if (academicDocs.length === 0 || !passport) {
        alert("Please upload at least one Academic Document and your Passport.");
        return;
    }

    setLoading(true);
    try {
      const academicDocUrls = [];
      for (const file of academicDocs) {
        const url = await uploadFile(file, 'academic');
        academicDocUrls.push(url);
      }
      const passportUrl = await uploadFile(passport, 'passport');

      await addDoc(collection(db, 'enrollments'), {
        userId: user.uid,
        userEmail: user.email,
        contactEmail,
        studentName: user.displayName || user.email.split('@')[0],
        schoolId: school.id,
        schoolName: school.name,
        program,
        course,
        phone,
        academicDocUrls,
        passportUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const waText = `*New Enrollment via AfroEduGo*\n\n*School:* ${school.name}\n*Program:* ${program}\n*Course:* ${course}\n*Student Phone:* ${phone}\n*Contact Email:* ${contactEmail}`;
      const waUrl = getWhatsAppLink('', waText);
      
      // Redirect directly to WhatsApp without opening a new window
      window.location.href = waUrl;
      
      onClose();
    } catch (error) {
      console.error("Error submitting enrollment:", error);
      alert("Failed to submit enrollment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const programs = ['BSc', 'MSc', 'PhD', 'Others'];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 sm:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none mb-2">Enroll Now</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">School: {school.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Program</label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <select 
                required
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold"
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
                  className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold"
                >
                  <option value="" disabled>Select Course</option>
                  {school.courses.map(c => {
                    const cName = c.name || c;
                    return <option key={cName} value={cName}>{cName}</option>
                  })}
                </select>
              ) : (
                <input 
                  required
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300"
                />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Contact Email</label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">WhatsApp / Phone Number</label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 000"
                className="w-full bg-transparent p-3 outline-none text-gray-900 font-bold placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Upload Academic Documents</label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleMultipleFilesChange(e, setAcademicDocs)}
                className="w-full bg-transparent p-3 outline-none text-gray-600 font-medium text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
              />
              {academicDocs.length > 0 && (
                <div className="px-3 pb-2 text-[10px] font-bold text-primary">
                  {academicDocs.length} file(s) selected
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Upload Passport</label>
            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, setPassport)}
                className="w-full bg-transparent p-3 outline-none text-gray-600 font-medium text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white py-4 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Enrollment</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14m-7-7 7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
          
          <p className="text-center text-[10px] text-gray-300 font-bold">
            By submitting, you agree to allow AfroEduGo to process your application and contact you regarding the next steps.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EnrollModal;
