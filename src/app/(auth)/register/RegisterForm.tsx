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
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  phone: z.string().min(10, 'Telefone invalido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas nao conferem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
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
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone || null,
          },
        },
      })

      if (error) {
        throw error
      }

      addToast('success', 'Cadastro realizado! Verifique seu email.')
      router.push(redirect)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar'
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
          <h1 className="text-2xl font-bold text-gray-900">Crie sua conta</h1>
          <p className="text-gray-500 mt-1">
            Cadastre-se para participar dos leiloes
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome completo"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Seu nome"
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="seu@email.com"
            />
            <Input
              label="Telefone (opcional)"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="(11) 99999-9999"
            />
            <Input
              label="Senha"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="********"
            />
            <Input
              label="Confirmar senha"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="********"
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Cadastrar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Ja tem uma conta?{' '}
            <Link
              href={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
