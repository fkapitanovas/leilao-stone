'use client'

import { createClient } from '@/lib/supabase/client'
import { Vehicle } from '@/types/database'
import { useEffect, useState, useCallback } from 'react'

interface BidItem {
  id: string
  vehicle_id: string
  user_id: string
  amount: number
  created_at: string
  profiles?: { name: string | null; email: string } | null
}

export function useBids(vehicleId: string) {
  const [bids, setBids] = useState<BidItem[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBids = useCallback(async () => {
    const { data: bidsData } = await supabase
      .from('bids')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    if (bidsData) {
      // Fetch profiles for each bid
      const enrichedBids = await Promise.all(
        bidsData.map(async (bid) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', bid.user_id)
            .single()

          return {
            ...bid,
            profiles: profile,
          }
        })
      )
      setBids(enrichedBids)
    }
    setLoading(false)
  }, [supabase, vehicleId])

  const fetchVehicle = useCallback(async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('current_price')
      .eq('id', vehicleId)
      .single()

    if (data) {
      setCurrentPrice(data.current_price)
    }
  }, [supabase, vehicleId])

  useEffect(() => {
    fetchBids()
    fetchVehicle()

    // Subscribe to bid changes
    const bidsChannel = supabase
      .channel(`bids:${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        async (payload) => {
          const newBid = payload.new as { id: string; vehicle_id: string; user_id: string; amount: number; created_at: string }

          // Fetch profile for the new bid
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', newBid.user_id)
            .single()

          const enrichedBid: BidItem = {
            ...newBid,
            profiles: profile,
          }

          setBids((prev) => [enrichedBid, ...prev])
          setCurrentPrice(newBid.amount)
        }
      )
      .subscribe()

    // Subscribe to vehicle price changes
    const vehicleChannel = supabase
      .channel(`vehicle:${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicles',
          filter: `id=eq.${vehicleId}`,
        },
        (payload) => {
          const vehicle = payload.new as Vehicle
          setCurrentPrice(vehicle.current_price)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bidsChannel)
      supabase.removeChannel(vehicleChannel)
    }
  }, [supabase, vehicleId, fetchBids, fetchVehicle])

  return {
    bids,
    currentPrice,
    loading,
    refetch: fetchBids,
  }
}
