'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Activity, RefreshCw } from 'lucide-react'

interface BidItem {
  id: string
  vehicle_id: string
  user_id: string
  amount: number
  created_at: string
  profiles?: { name: string | null; email: string } | null
  vehicles?: { title: string; status: string } | null
}

interface LiveBidsMonitorProps {
  initialBids: BidItem[]
}

export function LiveBidsMonitor({ initialBids }: LiveBidsMonitorProps) {
  const [bids, setBids] = useState<BidItem[]>(initialBids)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  useEffect(() => {
    // Subscribe to new bids
    const channel = supabase
      .channel('admin-bids-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
        },
        async (payload) => {
          const newBid = payload.new as { id: string; vehicle_id: string; user_id: string; amount: number; created_at: string }

          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', newBid.user_id)
            .single()

          // Fetch vehicle
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('title, status')
            .eq('id', newBid.vehicle_id)
            .single()

          const enrichedBid: BidItem = {
            ...newBid,
            profiles: profile,
            vehicles: vehicle,
          }

          setBids((prev) => [enrichedBid, ...prev].slice(0, 100))
          setLastUpdate(new Date())
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          const deletedBid = payload.old as { id: string }
          setBids((prev) => prev.filter((bid) => bid.id !== deletedBid.id))
          setLastUpdate(new Date())
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const refreshBids = async () => {
    const { data: bidsData } = await supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (bidsData) {
      const enrichedBids = await Promise.all(
        bidsData.map(async (bid) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', bid.user_id)
            .single()

          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('title, status')
            .eq('id', bid.vehicle_id)
            .single()

          return {
            ...bid,
            profiles: profile,
            vehicles: vehicle,
          }
        })
      )
      setBids(enrichedBids)
      setLastUpdate(new Date())
    }
  }

  return (
    <div>
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className={`h-5 w-5 ${isConnected ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado - Tempo Real' : 'Conectando...'}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Última atualização: {format(lastUpdate, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <button
          onClick={refreshBids}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Bids Table */}
      {bids.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum lance registrado ainda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bids.map((bid, index) => (
                <tr
                  key={bid.id}
                  className={`hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/auction/${bid.vehicle_id}`}
                      className="text-sm font-medium text-green-600 hover:text-green-700"
                    >
                      {bid.vehicles?.title || 'Veículo'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {bid.profiles?.name || 'Anônimo'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bid.profiles?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      {formatPrice(bid.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(bid.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bid.vehicles?.status === 'active' ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Ativo
                      </span>
                    ) : bid.vehicles?.status === 'ended' ? (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Encerrado
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Agendado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{bids.length}</p>
            <p className="text-xs text-gray-500">Total de lances</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {bids.length > 0 ? formatPrice(Math.max(...bids.map(b => b.amount))) : 'R$ 0'}
            </p>
            <p className="text-xs text-gray-500">Maior lance</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(bids.map(b => b.user_id)).size}
            </p>
            <p className="text-xs text-gray-500">Participantes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
