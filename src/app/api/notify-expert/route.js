import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIp } from '../../../utils/rateLimiter';
import { validateSupportRequest, escapeHtml } from '../../../utils/validators';
import { logger } from '../../../utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Strict Rate Limiting: Max 5 requests per 15 minutes per IP to prevent SMTP flooding
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`notify-expert:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a few minutes before trying again.' },
        { 
          status: 429,
          headers: { 'Retry-After': '900' }
        }
      );
    }

    const body = await request.json();

    // 2. Validate input schema
    const validation = validateSupportRequest(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { senderName, senderEmail, messagePreview } = validation.sanitized;

    // Check if SMTP environment variables are configured
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
      logger.warn("ADMIN_EMAIL or ADMIN_EMAIL_PASSWORD not configured. Skipping email dispatch.");
      return NextResponse.json({ success: true, message: 'Notification logged (email service unconfigured)' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
      },
    });

    // 3. Block Email HTML Injection / XSS by escaping user inputs
    const safeSenderName = escapeHtml(senderName || 'A Student');
    const safeSenderEmail = escapeHtml(senderEmail || 'No email provided');
    const safeMessagePreview = escapeHtml(messagePreview);

    const mailOptions = {
      from: `"AfroEduGo Support" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: senderEmail || undefined,
      subject: `New Support Request from ${safeSenderName}`,
      text: `You have a new support request from ${senderName || 'a user'} (${senderEmail || 'No email provided'}).\n\nMessage Preview:\n"${messagePreview}"\n\nGo to the AfroEduGo Admin Dashboard to reply: https://afroedugo.com/admin`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #133E33;">New Support Request</h2>
          <p><strong>From:</strong> ${safeSenderName} (${safeSenderEmail})</p>
          <div style="background: #FAF8F5; padding: 15px; border-radius: 8px; border-left: 4px solid #133E33; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">"${safeMessagePreview}"</p>
          </div>
          <p>Open the Admin Control Room to view the full conversation and reply.</p>
          <a href="https://afroedugo.com/admin" style="display: inline-block; background: #133E33; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Open Admin Dashboard</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    logger.error("Error sending expert notification email:", error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to dispatch notification email' },
      { status: 500 }
    );
  }
}
