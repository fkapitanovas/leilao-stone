import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Get all cookies and delete Supabase-related ones
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const response = NextResponse.json({ success: true })

  // Delete all Supabase cookies
  allCookies.forEach((cookie) => {
    if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
      response.cookies.delete(cookie.name)
    }
  })

  return response
}
