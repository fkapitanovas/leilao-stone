import { getFipeModels, VehicleType } from '@/lib/fipe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vehicleType = (searchParams.get('type') || 'cars') as VehicleType
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId é obrigatório' },
        { status: 400 }
      )
    }

    const models = await getFipeModels(vehicleType, brandId)

    return NextResponse.json(models)
  } catch (error) {
    console.error('Error fetching FIPE models:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modelos da FIPE' },
      { status: 500 }
    )
  }
}
