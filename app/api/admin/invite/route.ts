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
    const { email, fullName, propertyName } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json({ success: false, error: 'email and fullName are required' }, { status: 400 })
    }

    // 3. Send invite via Supabase service role
    //    This creates the user + sends the magic-link email automatically.
    const admin = createAdminClient()
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        property_name: propertyName ?? null,
        invited_by: user.id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    })

    if (inviteError) {
      return NextResponse.json({ success: false, error: inviteError.message }, { status: 400 })
    }

    // 4. Record invite in our own table for tracking
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
