const FIPE_API_BASE = 'https://fipe.parallelum.com.br/api/v2'

export type VehicleType = 'cars' | 'motorcycles' | 'trucks'

export interface FipeBrand {
  code: string
  name: string
}

export interface FipeModel {
  code: number
  name: string
}

export interface FipeYear {
  code: string
  name: string
}

export interface FipeVehicle {
  brand: string
  codeFipe: string
  fuel: string
  model: string
  modelYear: number
  price: string
  referenceMonth: string
  vehicleType: number
}

export interface FipePriceHistory {
  month: string
  price: string
  reference: string
}

async function fipeFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${FIPE_API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 86400 }, // Cache for 24 hours
  })

  if (!response.ok) {
    throw new Error(`FIPE API error: ${response.status}`)
  }

  return response.json()
}

export async function getFipeBrands(vehicleType: VehicleType = 'cars'): Promise<FipeBrand[]> {
  return fipeFetch<FipeBrand[]>(`/${vehicleType}/brands`)
}

export async function getFipeModels(
  vehicleType: VehicleType,
  brandId: string
): Promise<FipeModel[]> {
  return fipeFetch<FipeModel[]>(`/${vehicleType}/brands/${brandId}/models`)
}

export async function getFipeYears(
  vehicleType: VehicleType,
  brandId: string,
  modelId: string
): Promise<FipeYear[]> {
  return fipeFetch<FipeYear[]>(`/${vehicleType}/brands/${brandId}/models/${modelId}/years`)
}

export async function getFipePrice(
  vehicleType: VehicleType,
  brandId: string,
  modelId: string,
  yearId: string
): Promise<FipeVehicle> {
  return fipeFetch<FipeVehicle>(
    `/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`
  )
}

export async function getFipePriceByCode(
  vehicleType: VehicleType,
  fipeCode: string,
  yearId: string
): Promise<FipeVehicle> {
  return fipeFetch<FipeVehicle>(`/${vehicleType}/${fipeCode}/years/${yearId}`)
}

export async function getFipePriceHistory(
  vehicleType: VehicleType,
  fipeCode: string,
  yearId: string
): Promise<FipePriceHistory[]> {
  return fipeFetch<FipePriceHistory[]>(`/${vehicleType}/${fipeCode}/years/${yearId}/history`)
}

// Helper to normalize strings for comparison
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

// Check if two strings match (flexible matching)
function stringsMatch(str1: string, str2: string): boolean {
  const norm1 = normalizeString(str1)
  const norm2 = normalizeString(str2)

  // Exact match
  if (norm1 === norm2) {
    return true
  }

  // Check if one contains the other as a whole
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true
  }

  // Check if all words from the shorter string are in the longer one
  const words1 = norm1.split(' ').filter(w => w.length > 2)
  const words2 = norm2.split(' ').filter(w => w.length > 2)

  // For brand matching (single words), require exact match or containment
  if (words1.length === 1 || words2.length === 1) {
    const single = words1.length === 1 ? norm1 : norm2
    const other = words1.length === 1 ? norm2 : norm1
    return other.includes(single) || single.includes(other)
  }

  const shorter = words1.length <= words2.length ? words1 : words2
  const longer = words1.length <= words2.length ? norm2 : norm1

  const matchCount = shorter.filter(word => longer.includes(word)).length
  return matchCount >= Math.ceil(shorter.length * 0.6) // 60% of words match
}

// Helper to search for a vehicle by make, model, year
export async function searchFipeVehicle(
  make: string,
  model: string,
  year: number,
  vehicleType: VehicleType = 'cars'
): Promise<FipeVehicle | null> {
  try {
    // Get brands and find matching one
    const brands = await getFipeBrands(vehicleType)
    const brand = brands.find(
      (b) => stringsMatch(b.name, make)
    )

    if (!brand) return null

    // Get models and find matching one
    const models = await getFipeModels(vehicleType, brand.code)
    const matchingModel = models.find(
      (m) => stringsMatch(m.name, model)
    )

    if (!matchingModel) return null

    // Get years and find matching one
    const years = await getFipeYears(vehicleType, brand.code, String(matchingModel.code))
    const matchingYear = years.find(
      (y) => y.name.includes(String(year))
    )

    if (!matchingYear) return null

    // Get the price
    const price = await getFipePrice(
      vehicleType,
      brand.code,
      String(matchingModel.code),
      matchingYear.code
    )

    return price
  } catch (error) {
    console.error('Error searching FIPE vehicle:', error)
    return null
  }
}
