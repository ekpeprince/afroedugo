import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { senderName, senderEmail, messagePreview, conversationId } = await request.json();

    // Check if environment variables are configured
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
      console.warn("ADMIN_EMAIL or ADMIN_EMAIL_PASSWORD not set. Skipping email notification.");
      return NextResponse.json({ success: true, message: 'Skipped email (credentials not configured)' });
    }

    // Create a transporter using standard SMTP (e.g. Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Defaults to Gmail but can be configured
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD, // Use an App Password if using Gmail
      },
    });

    const mailOptions = {
      from: `"AfroEduGo Support" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Support Request from ${senderName || 'a user'}`,
      text: `You have a new support request from ${senderName || 'a user'} (${senderEmail || 'No email provided'}).\n\nMessage Preview:\n"${messagePreview}"\n\nGo to the AfroEduGo Admin Dashboard to reply: https://afroedugo.com/admin`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #065F46;">New Support Request</h2>
          <p><strong>From:</strong> ${senderName || 'A user'} (${senderEmail || 'No email provided'})</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #065F46; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">"${messagePreview}"</p>
          </div>
          <p>Open the Admin Control Room to view the full conversation and reply.</p>
          <a href="https://afroedugo.com/admin" style="display: inline-block; background: #065F46; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Open Admin Dashboard</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error("Error sending expert notification email:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
