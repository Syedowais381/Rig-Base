import nodemailer from 'nodemailer'

type SendInviteEmailInput = {
  to: string
  employeeName: string
  businessName: string
  roleName: string
  inviteUrl: string
}

function getTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<void> {
  const transport = getTransport()
  if (!transport) {
    throw new Error('Gmail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.')
  }

  const from = process.env.GMAIL_FROM ?? process.env.GMAIL_USER!

  await transport.sendMail({
    from: `"${input.businessName}" <${from}>`,
    to: input.to,
    subject: `You're invited to join ${input.businessName} on Rig Base`,
    text: [
      `Hi ${input.employeeName},`,
      '',
      `You've been invited to join ${input.businessName} on Rig Base as ${input.roleName}.`,
      '',
      `Open this link to create your account or sign in:`,
      input.inviteUrl,
      '',
      'This invitation was sent to this email address only.',
    ].join('\n'),
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a7340; margin: 0 0 16px;">Rig Base Invitation</p>
        <h1 style="font-size: 24px; font-weight: 500; margin: 0 0 12px;">Join ${input.businessName}</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">Hi ${input.employeeName},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">
          You've been invited to join <strong>${input.businessName}</strong> as <strong>${input.roleName}</strong>.
        </p>
        <p style="margin: 28px 0;">
          <a href="${input.inviteUrl}" style="display: inline-block; background: #c5a059; color: #111; text-decoration: none; padding: 12px 22px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em;">
            Accept invitation
          </a>
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #666;">
          You can create a new account or sign in with an existing one using <strong>${input.to}</strong>.
        </p>
        <p style="font-size: 12px; color: #888; word-break: break-all;">${input.inviteUrl}</p>
      </div>
    `,
  })
}
