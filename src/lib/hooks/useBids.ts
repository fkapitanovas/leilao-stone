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
      .order('amount', { ascending: false })

    if (bidsData) {
      setBids(bidsData)
    }
    setLoading(false)
  }, [supabase, vehicleId])

  const cancelBid = useCallback(async (bidId: string): Promise<{ success: boolean; error?: string; newPrice?: number }> => {
    try {
      const response = await fetch('/api/bids', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: bidId }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erro ao cancelar lance' }
      }

      // Remove bid from local state
      setBids((prev) => prev.filter((bid) => bid.id !== bidId))

      // Update current price
      if (result.new_price !== undefined) {
        setCurrentPrice(result.new_price)
      }

      return { success: true, newPrice: result.new_price }
    } catch {
      return { success: false, error: 'Erro ao cancelar lance' }
    }
  }, [])

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
        (payload) => {
          const newBid = payload.new as BidItem
          setBids((prev) => [newBid, ...prev].sort((a, b) => b.amount - a.amount))
          setCurrentPrice(newBid.amount)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bids',
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          const deletedBid = payload.old as { id: string }
          setBids((prev) => prev.filter((bid) => bid.id !== deletedBid.id))
          fetchVehicle() // Refresh current price
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
    cancelBid,
  }
}
