import { getFipeBrands, VehicleType } from '@/lib/fipe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vehicleType = (searchParams.get('type') || 'cars') as VehicleType

    const brands = await getFipeBrands(vehicleType)

    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching FIPE brands:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar marcas da FIPE' },
      { status: 500 }
    )
  }
}
