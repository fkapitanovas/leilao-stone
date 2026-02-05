import { getFipeYears, VehicleType } from '@/lib/fipe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vehicleType = (searchParams.get('type') || 'cars') as VehicleType
    const brandId = searchParams.get('brandId')
    const modelId = searchParams.get('modelId')

    if (!brandId || !modelId) {
      return NextResponse.json(
        { error: 'brandId e modelId são obrigatórios' },
        { status: 400 }
      )
    }

    const years = await getFipeYears(vehicleType, brandId, modelId)

    return NextResponse.json(years)
  } catch (error) {
    console.error('Error fetching FIPE years:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar anos da FIPE' },
      { status: 500 }
    )
  }
}
