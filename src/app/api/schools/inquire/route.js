import { NextResponse } from 'next/server';
import admin from '../../../../firebase/adminConfig';
import { Resend } from 'resend';
import { checkRateLimit, getClientIp } from '../../../../utils/rateLimiter';
import { escapeHtml, sanitizeText, isValidEmail } from '../../../../utils/validators';
import { logger } from '../../../../utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Standardized Student Confirmation HTML Email Generator.
 * Matches AfroEduGo design tokens: Emerald #065F46, Linen #FAF8F5, Sand #F4EFE6.
 */
function generateStudentConfirmationHtml({
  studentName,
  schoolName,
  schoolCountry,
  intake,
  phone,
}) {
  const safeStudentName = escapeHtml(studentName);
  const safeSchoolName = escapeHtml(schoolName);
  const safeSchoolCountry = escapeHtml(schoolCountry);
  const safeIntake = escapeHtml(intake);
  const safePhone = escapeHtml(phone);

  return `<!-- Subject Line: We have received your inquiry for ${safeSchoolName} — AfroEduGo Admissions -->
<!-- Preheader: Your application guide and next steps with an AfroEduGo Advisor. -->

<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border-radius: 12px; overflow: hidden; border: 1px solid #E6F4F0;">
  <div style="background-color: #065F46; padding: 32px 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; font-weight: 700;">AfroEduGo</h1>
    <p style="color: #E6F4F0; font-size: 14px; margin-top: 8px;">Your Gateway to Higher Education in Europe</p>
  </div>

  <div style="padding: 32px 24px; color: #14211D; line-height: 1.6;">
    <h2 style="font-size: 20px; color: #065F46; margin-top: 0;">Inquiry Confirmed: ${safeSchoolName}</h2>
    <p>Dear ${safeStudentName},</p>
    
    <p>Thank you for submitting your inquiry for <strong>${safeSchoolName}</strong> (${safeSchoolCountry}) through AfroEduGo. We have officially logged your profile and admission preferences with our academic mobility team.</p>

    <div style="background-color: #FFFFFF; border-left: 4px solid #065F46; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <h3 style="font-size: 14px; text-transform: uppercase; color: #555; margin-top: 0; margin-bottom: 8px;">Inquiry Summary</h3>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Institution:</strong> ${safeSchoolName}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${safeSchoolCountry}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Target Intake:</strong> ${safeIntake}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> Under Advisor Assessment</p>
    </div>

    <h3 style="font-size: 16px; color: #065F46;">What Happens Next?</h3>
    <ol style="padding-left: 20px; font-size: 14px; color: #333;">
      <li style="margin-bottom: 10px;"><strong>Eligibility Pre-Check:</strong> An academic advisor will review your selected program, high school or degree credentials, and country-specific admission criteria.</li>
      <li style="margin-bottom: 10px;"><strong>Personalized Outreach:</strong> You will be contacted via WhatsApp (${safePhone}) or email within <strong>24 to 48 business hours</strong> with verified requirements, document checklists, and application deadlines.</li>
      <li style="margin-bottom: 10px;"><strong>Full Mobility Guidance:</strong> Beyond university admission, your advisor will assist with student housing matching, TRP/visa appointment guidance, and arrival logistics.</li>
    </ol>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://www.afroedugo.com/community" style="background-color: #065F46; color: #FFFFFF; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Connect with Enrolled Students</a>
    </div>

    <p style="font-size: 13px; color: #666; margin-top: 24px;">Need urgent assistance or have updated academic transcripts to submit? Simply reply directly to this email or reach us at <a href="mailto:contact@afroedugo.com" style="color: #065F46;">contact@afroedugo.com</a>.</p>
    
    <p style="margin-top: 24px; font-weight: 600;">Warm regards,<br>The AfroEduGo Admissions & Mobility Team<br><span style="font-weight: 400; font-size: 12px; color: #666;">Kaunas, Lithuania</span></p>
  </div>

  <div style="background-color: #F4EFE6; padding: 16px 24px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #E6F4F0;">
    <p style="margin: 0;">&copy; 2026 AfroEduGo. All rights reserved. Platform for International Higher Education.</p>
  </div>
</div>`;
}

/**
 * Internal Admin Notification HTML Email Generator.
 */
function generateAdminNotificationHtml({
  studentName,
  email,
  phone,
  educationLevel,
  intake,
  selectedProgram,
  schoolName,
  schoolCountry,
  tuition,
  type,
  notes,
  submissionTimestamp,
}) {
  const safeStudentName = escapeHtml(studentName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeEducation = escapeHtml(educationLevel);
  const safeIntake = escapeHtml(intake);
  const safeProgram = escapeHtml(selectedProgram || 'General Inquiry');
  const safeSchoolName = escapeHtml(schoolName);
  const safeSchoolCountry = escapeHtml(schoolCountry);
  const safeTuition = escapeHtml(tuition || 'Not specified');
  const safeType = escapeHtml(type === 'enrollment' ? 'Enrollment Application' : 'Advisor Advisory Inquiry');
  const safeNotes = escapeHtml(notes || 'None provided');
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

  return `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border-radius: 12px; overflow: hidden; border: 1px solid #E6F4F0;">
  <div style="background-color: #065F46; padding: 28px 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; margin: 0; font-weight: 700;">AfroEduGo Admissions Control</h1>
    <p style="color: #E6F4F0; font-size: 13px; margin-top: 6px;">New Prospective Student Lead Received</p>
  </div>

  <div style="padding: 28px 24px; color: #14211D; line-height: 1.6;">
    <div style="display: inline-block; background-color: ${type === 'enrollment' ? '#065F46' : '#0284C7'}; color: #FFFFFF; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
      ${safeType}
    </div>

    <h2 style="font-size: 18px; color: #065F46; margin: 0 0 16px 0;">Lead Parameters: ${safeStudentName}</h2>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <tbody>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563; width: 38%;">Student Name</td>
          <td style="padding: 10px 14px; color: #111827; font-weight: 600;">${safeStudentName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Email Address</td>
          <td style="padding: 10px 14px; color: #065F46;"><a href="mailto:${safeEmail}" style="color: #065F46; text-decoration: underline;">${safeEmail}</a></td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">WhatsApp / Phone</td>
          <td style="padding: 10px 14px; color: #111827;">
            ${safePhone}
            ${cleanPhone ? `&nbsp;(<a href="https://wa.me/${cleanPhone}" target="_blank" style="color: #25D366; font-weight: 700; text-decoration: none;">Chat on WhatsApp</a>)` : ''}
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Education Level</td>
          <td style="padding: 10px 14px; color: #111827;">${safeEducation}</td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Target Intake</td>
          <td style="padding: 10px 14px; color: #111827;">${safeIntake}</td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Program / Degree</td>
          <td style="padding: 10px 14px; color: #111827;">${safeProgram}</td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Target University</td>
          <td style="padding: 10px 14px; color: #111827;"><strong>${safeSchoolName}</strong> (${safeSchoolCountry})</td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Estimated Tuition</td>
          <td style="padding: 10px 14px; color: #111827;">${safeTuition}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: 700; color: #4B5563;">Additional Notes</td>
          <td style="padding: 10px 14px; color: #374151;">${safeNotes}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 24px; text-align: center;">
      <a href="https://www.afroedugo.com/admin" style="background-color: #065F46; color: #FFFFFF; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">Open Admin Control Room</a>
    </div>

    <p style="font-size: 11px; color: #9CA3AF; margin-top: 24px; text-align: center;">Logged at: ${escapeHtml(submissionTimestamp || new Date().toISOString())}</p>
  </div>
</div>`;
}

export async function POST(request) {
  try {
    // 1. IP Rate Limiting (max 15 inquiry requests per minute per IP)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`school-inquire:${ip}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many inquiries submitted. Please wait a minute before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );
    }

    const body = await request.json();

    // 2. Validate & Sanitize Inputs
    const studentName = sanitizeText(body.studentName || body.name, 120);
    const email = (body.email || body.contactEmail || '').trim().toLowerCase();
    const phone = sanitizeText(body.phone, 40);
    const educationLevel = sanitizeText(body.educationLevel || "Bachelor's", 60);
    const intake = sanitizeText(body.intake || 'Autumn 2027', 60);
    const selectedProgram = sanitizeText(body.selectedProgram || body.course || body.program || '', 150);
    const schoolId = sanitizeText(body.schoolId, 100);
    const schoolName = sanitizeText(body.schoolName, 200);
    const schoolCountry = sanitizeText(body.schoolCountry || 'Lithuania', 100);
    const tuition = sanitizeText(body.tuition || body.estimatedTuition || '', 100);
    const type = body.type === 'enrollment' ? 'enrollment' : 'advisory';
    const notes = sanitizeText(body.notes || body.message || '', 1500);
    const userId = sanitizeText(body.userId || '', 100);
    const submissionTimestamp = body.submissionTimestamp || new Date().toISOString();

    const errors = [];
    if (!studentName || studentName.length < 2) {
      errors.push('Full Name is required (minimum 2 characters)');
    }
    if (!email || !isValidEmail(email)) {
      errors.push('A valid email address is required');
    }
    if (!phone || phone.length < 5) {
      errors.push('Phone or WhatsApp number with country code is required');
    }
    if (!schoolId || !schoolName) {
      errors.push('Institution details (schoolId, schoolName) are required');
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
    }

    // 3. Dual-Write Pipeline: Persistent Write to Firestore `leads` Collection
    let leadId = null;
    let notifiedAdmin = false;
    let notifiedStudent = false;

    const leadPayload = {
      studentName,
      email,
      phone,
      educationLevel,
      intake,
      schoolId,
      schoolName,
      schoolCountry,
      tuition,
      type,
      selectedProgram,
      notes,
      status: 'new', // new | reviewing | contacted | enrolled | rejected
      notifiedAdmin: false,
      notifiedStudent: false,
      createdAt: admin.apps.length ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      ...(userId ? { userId } : {}),
    };

    let docRef = null;
    if (admin.apps.length) {
      try {
        docRef = await admin.firestore().collection('leads').add(leadPayload);
        leadId = docRef.id;
      } catch (dbErr) {
        logger.error('Failed to write lead to Firestore via Admin SDK:', dbErr.message);
      }
    } else {
      logger.warn('Firebase Admin not initialized on server. Proceeding with dispatch layer.');
    }

    // 4. Dispatch Layer via Resend SDK
    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    const fromSender = process.env.RESEND_FROM_EMAIL || 'AfroEduGo Admissions <admissions@afroedugo.com>';
    const adminRecipient = process.env.ADMIN_INBOX_EMAIL || 'contact@afroedugo.com';

    // Alert 1: Admin Notification
    const adminSubject = `[New Lead] ${type === 'enrollment' ? 'Enrollment' : 'Advisory'} Inquiry: ${studentName} — ${schoolName}`;
    const adminHtml = generateAdminNotificationHtml({
      studentName,
      email,
      phone,
      educationLevel,
      intake,
      selectedProgram,
      schoolName,
      schoolCountry,
      tuition,
      type,
      notes,
      submissionTimestamp,
    });

    // Alert 2: Standardized Student Confirmation
    const studentSubject = `We have received your inquiry for ${schoolName} — AfroEduGo Admissions`;
    const studentHtml = generateStudentConfirmationHtml({
      studentName,
      schoolName,
      schoolCountry,
      intake,
      phone,
    });

    if (resend) {
      // Dispatch Alert 1 (Admin Inbox)
      try {
        await resend.emails.send({
          from: fromSender,
          to: adminRecipient,
          subject: adminSubject,
          html: adminHtml,
        });
        notifiedAdmin = true;
      } catch (emailErr) {
        logger.error('Failed to send admin lead notification email via Resend:', emailErr.message);
      }

      // Dispatch Alert 2 (Prospective Student Confirmation)
      try {
        await resend.emails.send({
          from: fromSender,
          to: email,
          subject: studentSubject,
          html: studentHtml,
        });
        notifiedStudent = true;
      } catch (emailErr) {
        logger.error('Failed to send student confirmation email via Resend:', emailErr.message);
      }
    } else {
      logger.warn(`RESEND_API_KEY unconfigured. Simulated dual-dispatch to Admin (${adminRecipient}) and Student (${email})`);
      notifiedAdmin = true;
      notifiedStudent = true;
    }

    // 5. Update lead document flags if Firestore write succeeded
    if (docRef && (notifiedAdmin || notifiedStudent)) {
      try {
        await docRef.update({
          notifiedAdmin,
          notifiedStudent,
        });
      } catch (updateErr) {
        logger.warn('Failed to update notification flags on lead document:', updateErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      leadId,
      notifiedAdmin,
      notifiedStudent,
      message: 'Inquiry Sent! An advisor will reach out via WhatsApp/Email within 24 hours',
    });
  } catch (error) {
    logger.error('Error in /api/schools/inquire:', error.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your inquiry. Please try again.' },
      { status: 500 }
    );
  }
}
