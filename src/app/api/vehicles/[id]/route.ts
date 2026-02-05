import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single vehicle
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Veiculo nao encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PUT - Update vehicle (admin only)
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().min(1900).optional(),
  mileage: z.number().min(0).optional(),
  color: z.string().min(1).optional(),
  description: z.string().optional(),
  starting_price: z.number().min(0.01).optional(),
  min_bid_increment: z.number().min(0.01).optional(),
  images: z.array(z.string()).optional(),
  auction_start: z.string().optional(),
  auction_end: z.string().optional(),
  status: z.enum(['scheduled', 'active', 'ended', 'cancelled']).optional(),
})

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Check admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Validate body
  const body = await request.json()
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .update({
      ...result.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(vehicle)
}

// DELETE - Delete vehicle (admin only, only scheduled/cancelled)
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Check admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Check vehicle status
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', id)
    .single()

  if (vehicle && !['scheduled', 'cancelled'].includes(vehicle.status)) {
    return NextResponse.json(
      { error: 'Nao e possivel excluir um leilao ativo ou encerrado' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
