import { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'orange' | 'purple'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-blue-600'
  },
  green: {
    bg: 'bg-green-500',
    light: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    gradient: 'from-green-500 to-green-600'
  },
  orange: {
    bg: 'bg-orange-500',
    light: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    gradient: 'from-orange-500 to-orange-600'
  },
  purple: {
    bg: 'bg-purple-500',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-purple-600'
  },
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'blue' 
}: Props) {
  const colors = colorClasses[color]
  
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-3 group-hover:scale-105 transition-transform">
            {value}
          </p>
          
          {trend && (
            <div className="flex items-center gap-2">
              <span className={`
                flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg
                ${trend.isPositive 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'
                }
              `}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={`
          p-4 rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg
          group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
        `}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )
}