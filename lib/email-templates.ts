function layout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a4d2e;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Sunda Trips</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;text-align:center;">
          &copy; Sunda Trips &mdash; Bali &amp; Beyond
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function partnerInviteEmail(opts: {
  fullName: string
  companyName?: string | null
  inviteLink: string
}) {
  const { fullName, companyName, inviteLink } = opts
  const greeting = companyName ? companyName : fullName

  return {
    subject: `You're invited to join Sunda Trips as a partner`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">Hi ${greeting},</h2>
      <p style="color:#71717a;font-size:13px;margin:0 0 20px;">Welcome aboard!</p>
      <p style="color:#404040;line-height:1.6;margin:0 0 8px;">
        You've been invited to join <strong>Sunda Trips</strong> as a partner.
        Click the button below to set up your password and complete your profile.
      </p>
      <p style="color:#404040;line-height:1.6;margin:0 0 24px;">
        Once you're set up, you'll be able to manage bookings, view your schedule, and
        collaborate with the Sunda Trips team.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td align="center">
          <a href="${inviteLink}" style="display:inline-block;background:#1a4d2e;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
            Set Up My Account
          </a>
        </td></tr>
      </table>
      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0 0 4px;">
        This link is valid for 24 hours. If it expires, ask your admin to send a new one.
      </p>
      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${inviteLink}" style="color:#1a4d2e;word-break:break-all;">${inviteLink}</a>
      </p>
    `),
  }
}

export function ownerInviteEmail(opts: {
  fullName: string
  companyName?: string | null
  inviteLink: string
}) {
  const { fullName, companyName, inviteLink } = opts
  const greeting = companyName ? companyName : fullName

  return {
    subject: `You're invited to join Sunda Trips`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">Hi ${greeting},</h2>
      <p style="color:#71717a;font-size:13px;margin:0 0 20px;">Welcome to Sunda Trips!</p>
      <p style="color:#404040;line-height:1.6;margin:0 0 8px;">
        You've been invited to list your business on <strong>Sunda Trips</strong>.
        Click the button below to create your password and start managing your listings.
      </p>
      <p style="color:#404040;line-height:1.6;margin:0 0 24px;">
        After signing in you can add your properties, set pricing, manage availability, and
        start receiving bookings right away.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td align="center">
          <a href="${inviteLink}" style="display:inline-block;background:#1a4d2e;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
            Set Up My Account
          </a>
        </td></tr>
      </table>
      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0 0 4px;">
        This link is valid for 24 hours. If it expires, ask your admin to send a new one.
      </p>
      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${inviteLink}" style="color:#1a4d2e;word-break:break-all;">${inviteLink}</a>
      </p>
    `),
  }
}
