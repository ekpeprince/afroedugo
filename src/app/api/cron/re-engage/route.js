import { NextResponse } from 'next/server';
import admin from '../../../../firebase/adminConfig';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allows up to 60s for batch email dispatch

/**
 * GET /api/cron/re-engage
 * Scheduled cron job invoked once daily (or manually triggered with Bearer CRON_SECRET).
 * 
 * Logic:
 * 1. Checks CRON_SECRET authorization header.
 * 2. Finds users whose lastActiveAt <= 20 days ago, who opted into marketing,
 *    and who haven't yet received a re-engagement email (reEngagementSentAt == null).
 * 3. Sends a win-back email via Resend with top student resources.
 * 4. Stamps reEngagementSentAt with server timestamp to prevent duplicate emails.
 */
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '../../../../utils/rateLimiter';
import { logger } from '../../../../utils/logger';


export async function GET(req) {
  // 1. Rate limiting (max 10 cron trigger checks per hour per IP)
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(`cron-reengage:${ip}`, 10, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many cron trigger attempts' }, { status: 429 });
  }

  // 2. Authenticate the Cron request with mandatory secret
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error('CRON_SECRET is not configured on server');
    return NextResponse.json({ error: 'Cron secret unconfigured' }, { status: 500 });
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  const headerBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expectedAuth);

  const isAuthValid = headerBuf.length === expectedBuf.length && 
    crypto.timingSafeEqual(headerBuf, expectedBuf);

  if (!isAuthValid) {
    logger.warn('Unauthorized attempt to trigger /api/cron/re-engage from IP:', ip);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure Firebase Admin is initialized
  if (!admin.apps.length) {
    return NextResponse.json({ 
      error: 'Firebase Admin not initialized. Please verify service account credentials.' 
    }, { status: 500 });
  }

  const db = admin.firestore();

  try {
    // 2. Calculate the 20-day cutoff timestamp
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    // 3. Query: Inactive for >= 20 days, opted in, and haven't received a win-back email yet
    // Limit to 50 to stay well within serverless execution limits
    const snapshot = await db
      .collection('users')
      .where('emailPreferences.marketing', '==', true)
      .where('lastActiveAt', '<=', cutoffTimestamp)
      .where('reEngagementSentAt', '==', null)
      .limit(50)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        message: 'No dormant users to email.',
        cutoff: cutoffDate.toISOString(),
        checkedAt: now.toISOString()
      }, { status: 200 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    let emailsSent = 0;
    const emailPromises = snapshot.docs.map(async (docSnap) => {
      const user = docSnap.data();

      if (!user.email) return null;

      // Double-check in case reEngagementSentAt was stamped in parallel
      if (user.reEngagementSentAt) return null;

      const userName = user.displayName || user.email.split('@')[0] || 'Scholar';

      // 4. Send win-back message via Resend
      if (resend) {
        await resend.emails.send({
          from: 'AfroEduGo Community <team@afroedugo.com>',
          to: user.email,
          subject: `It's been a while, ${userName} — here is what's new on AfroEduGo`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; rounded: 12px;">
              <div style="margin-bottom: 20px;">
                <span style="background: #e8f5e9; color: #1b5e20; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">AfroEduGo Community</span>
              </div>
              <h2 style="font-size: 22px; font-weight: 800; color: #0b141a; margin-top: 0; margin-bottom: 12px;">We miss seeing you around, ${userName}! 🌍</h2>
              <p style="font-size: 14px; color: #444; margin-bottom: 16px;">A lot of fresh opportunities have arrived on the platform since your last visit:</p>
              
              <ul style="padding-left: 20px; margin: 16px 0; font-size: 14px; color: #333;">
                <li style="margin-bottom: 10px;"><strong>Verified Housing & Flats:</strong> New student apartments in Kaunas & Vilnius verified for TRP declaration.</li>
                <li style="margin-bottom: 10px;"><strong>Student Work & TRP Guides:</strong> Up-to-date rules on 20h vs 40h work permits, Sodra social insurance, and tax exemptions.</li>
                <li style="margin-bottom: 10px;"><strong>Community Discussions:</strong> Connect with incoming and current scholars sharing tips on life in Lithuania.</li>
              </ul>

              <div style="margin: 28px 0;">
                <a href="https://afroedugo.com/community" 
                   style="background: #15803d; color: #ffffff; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                  Jump Back Into AfroEduGo →
                </a>
              </div>

              <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 12px; color: #888; line-height: 1.5; margin: 0;">
                AfroEduGo &bull; Built for international students across Europe.<br />
                You received this email because you opted into student community updates.<br />
                <a href="https://afroedugo.com/privacy" style="color: #666; text-decoration: underline;">Privacy Policy</a> &bull; 
                <a href="https://afroedugo.com/terms" style="color: #666; text-decoration: underline;">Terms of Service</a>
              </p>
            </div>
          `,
        });
        emailsSent++;
      } else {
        console.warn(`[cron/re-engage] RESEND_API_KEY not set. Simulated email to ${user.email}`);
        emailsSent++;
      }

      // 5. Stamp document so this email is NEVER sent again to this user
      return docSnap.ref.update({
        reEngagementSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      processed: snapshot.size,
      sentEmails: emailsSent,
      resendConfigured: !!resend,
      cutoff: cutoffDate.toISOString(),
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Re-engagement cron error:', error);
    
    // Check if Firestore reported a missing composite index
    const isMissingIndex = error.message && error.message.includes('FAILED_PRECONDITION');
    
    return NextResponse.json({
      error: error.message,
      missingCompositeIndex: isMissingIndex,
      indexGuidance: isMissingIndex
        ? 'Create composite index in Firebase Console: Collection "users" -> fields: emailPreferences.marketing (ASC), reEngagementSentAt (ASC), lastActiveAt (ASC)'
        : undefined,
    }, { status: 500 });
  }
}
