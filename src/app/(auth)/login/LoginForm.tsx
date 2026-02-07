'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Car } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

function getSafeRedirect(redirect: string | null): string {
  if (!redirect) return '/'
  // Only allow relative paths starting with /
  // Reject absolute URLs, protocol-relative URLs, and javascript: URIs
  if (
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.startsWith('/\\') &&
    !redirect.toLowerCase().includes('javascript:')
  ) {
    return redirect
  }
  return '/'
}

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = getSafeRedirect(searchParams.get('redirect'))
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        throw error
      }

      addToast('success', 'Login realizado com sucesso!')
      router.push(redirect)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      addToast('error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-xl">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Entre na sua conta
          </h1>
          <p className="text-gray-500 mt-1">
            Acesse para participar dos leiloes
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="seu@email.com"
            />
            <Input
              label="Senha"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="********"
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Nao tem uma conta?{' '}
            <Link
              href={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
