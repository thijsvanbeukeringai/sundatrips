import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // 1. Verify the caller is an admin
    const supabase      = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse and validate body
    const { email, fullName, propertyName, role } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json({ success: false, error: 'email and fullName are required' }, { status: 400 })
    }

    const inviteRole = role === 'partner' ? 'partner' : undefined

    // 3. Generate invite link via Supabase (without sending built-in email)
    const admin = createAdminClient()
    const { data: linkData, error: inviteError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: {
          full_name: fullName,
          property_name: propertyName ?? null,
          invited_by: user.id,
          ...(inviteRole ? { role: inviteRole } : {}),
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
      },
    })

    if (inviteError) {
      return NextResponse.json({ success: false, error: inviteError.message }, { status: 400 })
    }

    // 4. Send invite email via Mailgun template
    const { sendMailWithTemplate } = await import('@/lib/mailgun')

    const inviteLink = linkData.properties.action_link

    try {
      await sendMailWithTemplate({
        to: email,
        subject: inviteRole === 'partner'
          ? "You're invited to join Sunda Trips as a partner"
          : "You're invited to join Sunda Trips",
        template: 'invitation',
        variables: {
          name: propertyName || fullName,
          inviteLink,
        },
      })
    } catch (err) {
      console.error('[invite] Mailgun error:', err)
      return NextResponse.json({ success: false, error: 'Failed to send invite email' }, { status: 500 })
    }

    // 5. If partner: set role on their profile immediately (don't wait for onboarding)
    //    The handle_new_user trigger creates the profile synchronously, so it exists now.
    if (inviteRole === 'partner') {
      await admin.from('profiles').update({ role: 'partner' }).eq('email', email)
    }

    // 6. Record invite in our own table for tracking
    await supabase.from('invites').upsert({
      email,
      invited_by: user.id,
      property_name: propertyName ?? null,
    }, { onConflict: 'email' })

    return NextResponse.json({ success: true, email })

  } catch (err) {
    console.error('[invite]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
