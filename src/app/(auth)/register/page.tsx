import { Suspense } from 'react'
import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
