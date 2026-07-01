import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendCollaborationInvite({
  toEmail,
  toName,
  fromName,
  documentTitle,
  documentId,
  role,
}) {
  const documentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/editor/${documentId}`;

  try {
    await transporter.sendMail({
      from: `"DocuSync" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `${fromName} shared a document with you on DocuSync`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
              
              <!-- Header -->
              <div style="background: #2563eb; padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📄 DocuSync</h1>
                <p style="color: #bfdbfe; margin: 8px 0 0;">Local-first collaborative editor</p>
              </div>

              <!-- Body -->
              <div style="padding: 32px;">
                <h2 style="color: #111827; margin: 0 0 16px;">You've been invited to collaborate!</h2>
                
                <p style="color: #6b7280; line-height: 1.6;">
                  <strong style="color: #111827;">${fromName}</strong> has shared a document with you on DocuSync.
                </p>

                <!-- Document Card -->
                <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Document</p>
                  <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #111827;">📄 ${documentTitle}</p>
                  <span style="background: ${role === "EDITOR" ? "#dbeafe" : "#f3f4f6"}; color: ${role === "EDITOR" ? "#1d4ed8" : "#6b7280"}; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 500;">
                    ${role === "EDITOR" ? "✏️ Editor" : "👁️ Viewer"}
                  </span>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  ${role === "EDITOR"
                    ? "As an <strong>Editor</strong>, you can read and edit this document."
                    : "As a <strong>Viewer</strong>, you can read this document."
                  }
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0 16px;">
                  <a href="${documentUrl}" 
                     style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                    Open Document →
                  </a>
                </div>

                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Or copy this link: <a href="${documentUrl}" style="color: #2563eb;">${documentUrl}</a>
                </p>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #f3f4f6; padding: 20px 32px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Sent by DocuSync · If you don't have an account,
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signin" style="color: #2563eb;">sign up here</a> first.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}