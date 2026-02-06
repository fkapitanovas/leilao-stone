'use client'

import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Auth error:', error)
          setLoading(false)
          return
        }

        setUser(user)

        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          setProfile(profileData)
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
        clearTimeout(timeout)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profileData)
        } else {
          setProfile(null)
        }

        router.refresh()
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      // Call server-side logout to clear cookies
      await fetch('/api/auth/logout', { method: 'POST' })

      // Also sign out on client side
      await supabase.auth.signOut({ scope: 'global' })
    } catch (error) {
      console.error('Sign out error:', error)
    }

    // Clear all Supabase-related storage
    if (typeof window !== 'undefined') {
      // Clear localStorage items related to Supabase
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Clear sessionStorage too
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionStorage.removeItem(key)
        }
      }
    }

    // Clear state and force full page reload
    setUser(null)
    setProfile(null)
    window.location.href = '/'
  }

  return {
    user,
    profile,
    loading,
    isAdmin: profile?.is_admin ?? false,
    signOut,
  }
}
