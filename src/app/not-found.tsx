import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Car } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-6 rounded-full">
            <Car className="h-16 w-16 text-gray-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-8">Pagina nao encontrada</p>
        <Link href="/">
          <Button size="lg">Voltar para o inicio</Button>
        </Link>
      </div>
    </div>
  )
}
