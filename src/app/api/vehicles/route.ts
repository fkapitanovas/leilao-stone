import { createClient } from '@/lib/supabase/server'
import { validateAdmin } from '@/lib/auth/validateAdmin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET - List vehicles
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .in('status', ['active', 'scheduled'])
    .order('auction_end', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create vehicle (admin only)
const createSchema = z.object({
  title: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1900),
  mileage: z.number().min(0),
  color: z.string().min(1),
  description: z.string().optional(),
  starting_price: z.number().min(0.01),
  min_bid_increment: z.number().min(0.01).default(100),
  images: z.array(z.string()).default([]),
  auction_start: z.string(),
  auction_end: z.string(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check auth and admin status
  const adminCheck = await validateAdmin(supabase)
  if (!adminCheck.success) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
  }

  // Validate body
  const body = await request.json()
  const result = createSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const data = result.data

  // Determine initial status
  const now = new Date()
  const auctionStart = new Date(data.auction_start)
  const status = auctionStart <= now ? 'active' : 'scheduled'

  // Create vehicle
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert({
      ...data,
      current_price: data.starting_price,
      status,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(vehicle, { status: 201 })
}
