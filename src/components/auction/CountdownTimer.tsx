'use client'

import { useCountdown } from '@/lib/hooks/useCountdown'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endDate: string
}

export function CountdownTimer({ endDate }: CountdownTimerProps) {
  const { timeLeft, isExpired } = useCountdown(endDate)

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <Clock className="h-5 w-5" />
        <span className="font-semibold">Leilão encerrado</span>
      </div>
    )
  }

  const isUrgent = timeLeft.total < 60 * 60 * 1000 // Less than 1 hour

  return (
    <div className={`space-y-2 ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
      <div className="flex items-center gap-2">
        <Clock className={`h-5 w-5 ${isUrgent ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium">Tempo restante</span>
      </div>
      <div className="flex gap-2">
        <TimeBlock value={timeLeft.days} label="Dias" />
        <span className="text-2xl font-bold">:</span>
        <TimeBlock value={timeLeft.hours} label="Horas" />
        <span className="text-2xl font-bold">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-2xl font-bold">:</span>
        <TimeBlock value={timeLeft.seconds} label="Seg" />
      </div>
    </div>
  )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
