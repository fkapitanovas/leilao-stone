import { searchFipeVehicle, VehicleType } from '@/lib/fipe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vehicleType = (searchParams.get('type') || 'cars') as VehicleType
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const year = searchParams.get('year')

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'make, model e year são obrigatórios' },
        { status: 400 }
      )
    }

    const vehicle = await searchFipeVehicle(make, model, parseInt(year), vehicleType)

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado na tabela FIPE' },
        { status: 404 }
      )
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Error searching FIPE vehicle:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar veículo na FIPE' },
      { status: 500 }
    )
  }
}
