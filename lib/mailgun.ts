const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY!
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN!
const MAILGUN_FROM = process.env.MAILGUN_FROM ?? `Sunda Trips <noreply@${MAILGUN_DOMAIN}>`
const MAILGUN_BASE = `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}`

/**
 * Send an email using a Mailgun template.
 * Variables are passed as template data (use {{variable}} in your Mailgun template).
 */
export async function sendMailWithTemplate(opts: {
  to: string
  subject: string
  template: string
  variables: Record<string, string>
}) {
  const form = new URLSearchParams()
  form.append('from', MAILGUN_FROM)
  form.append('to', opts.to)
  form.append('subject', opts.subject)
  form.append('template', opts.template)
  form.append('h:X-Mailgun-Variables', JSON.stringify(opts.variables))

  const res = await fetch(`${MAILGUN_BASE}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
    },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mailgun error (${res.status}): ${body}`)
  }

  return res.json()
}

/**
 * Send a raw HTML email (fallback for emails without a Mailgun template).
 */
export async function sendMail(opts: {
  to: string
  subject: string
  html: string
}) {
  const form = new URLSearchParams()
  form.append('from', MAILGUN_FROM)
  form.append('to', opts.to)
  form.append('subject', opts.subject)
  form.append('html', opts.html)

  const res = await fetch(`${MAILGUN_BASE}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
    },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mailgun error (${res.status}): ${body}`)
  }

  return res.json()
}
