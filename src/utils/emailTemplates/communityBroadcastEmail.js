/**
 * Generates the responsive, branded HTML email for community post broadcasts.
 * Design tokens: Forest Emerald (#065F46), Sand (#F4EFE6), Linen (#FAF8F5).
 */
export function generateCommunityBroadcastEmail({
  studentName = 'Student',
  postTitle = 'New Discussion in the Community',
  postSnippet = '',
  categoryName = 'General',
  authorName = 'A fellow student',
  postId = '',
}) {
  const postUrl = postId 
    ? `https://www.afroedugo.com/community#post-${postId}`
    : 'https://www.afroedugo.com/community';
  
  const preferencesUrl = 'https://www.afroedugo.com/profile';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Discussion on AfroEduGo</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F4EFE6; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border-radius: 12px; overflow: hidden; border: 1px solid #E6F4F0; box-shadow: 0 4px 12px rgba(6, 95, 70, 0.04);">
    
    <!-- Header -->
    <div style="background-color: #065F46; padding: 28px 24px; text-align: center;">
      <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">AfroEduGo Community</h1>
      <p style="color: #E6F4F0; font-size: 13px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
        New topic shared in #${categoryName}
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px 24px; color: #14211D; line-height: 1.6;">
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${studentName}</strong>,</p>
      
      <p style="font-size: 15px; color: #2D3748;">
        A new topic has just been shared in the student network that may be relevant to your studies, visa process, or university plans:
      </p>

      <!-- Post Card Callout -->
      <div style="background-color: #FFFFFF; border-left: 4px solid #065F46; padding: 18px 20px; margin: 24px 0; border-radius: 6px; border-top: 1px solid #EFEAE2; border-right: 1px solid #EFEAE2; border-bottom: 1px solid #EFEAE2;">
        <h2 style="font-size: 17px; margin: 0 0 10px 0; color: #065F46; font-weight: 700; line-height: 1.4;">
          ${postTitle}
        </h2>
        <p style="font-size: 14px; color: #4B5563; margin: 0; line-height: 1.6;">
          "${postSnippet}"
        </p>
        <div style="margin-top: 12px; font-size: 12px; color: #718096;">
          <span>Shared by: <strong>${authorName}</strong></span>
          <span style="margin: 0 6px;">•</span>
          <span style="background-color: #E6F4F0; color: #065F46; padding: 2px 8px; border-radius: 4px; font-weight: 600;">#${categoryName}</span>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${postUrl}" style="background-color: #065F46; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
          Join Discussion & Reply
        </a>
      </div>

      <!-- Secondary Links -->
      <p style="font-size: 13px; color: #718096; text-align: center; margin-top: 24px;">
        Need advice on European universities? <a href="https://www.afroedugo.com/schools" style="color: #065F46; text-decoration: underline; font-weight: 600;">Browse Vetted Programs</a>
      </p>
    </div>

    <!-- Footer & Unsubscribe -->
    <div style="background-color: #F4EFE6; padding: 20px 24px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #E6F4F0;">
      <p style="margin: 0 0 8px 0;">
        You received this update because you are a registered member of the AfroEduGo student community.
      </p>
      <p style="margin: 0;">
        To manage what emails you receive, <a href="${preferencesUrl}" style="color: #065F46; text-decoration: underline;">update your email preferences</a>.
      </p>
      <p style="margin: 12px 0 0 0; color: #A0AEC0;">
        &copy; 2026 AfroEduGo. Platform for International Higher Education. Kaunas, Lithuania.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
