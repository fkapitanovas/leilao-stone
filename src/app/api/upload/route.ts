import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdmin } from '@/lib/auth/validateAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check auth and admin status
  const adminCheck = await validateAdmin(supabase)
  if (!adminCheck.success) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Arquivo nao enviado' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo nao permitido' }, { status: 400 })
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande (max 5MB)' }, { status: 400 })
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
  const path = `vehicles/${filename}`

  // Upload using admin client
  const adminClient = createAdminClient()
  const { error: uploadError } = await adminClient.storage
    .from('images')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = adminClient.storage
    .from('images')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
