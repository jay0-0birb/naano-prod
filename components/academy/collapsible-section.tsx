'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  children: React.ReactNode
  defaultOpen?: boolean
  level?: number
}

export default function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  level = 0
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  // Calculate indentation based on nesting level
  const getIndentClass = (level: number) => {
    switch (level) {
      case 1: return 'ml-6'
      case 2: return 'ml-12'
      case 3: return 'ml-16'
      default: return ''
    }
  }
  
  const indentClass = getIndentClass(level)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 text-left py-2 hover:bg-gray-50 rounded px-1 transition-colors group ${indentClass}`}
      >
        <ChevronRight 
          className={`w-4 h-4 text-[#94A3B8] transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-90' : ''
          }`} 
        />
        {icon && <span className="text-lg">{icon}</span>}
        <span className="font-semibold text-[#111827] text-sm">{title}</span>
      </button>
      {isOpen && (
        <div className={`ml-6 mt-2 space-y-4 ${indentClass}`}>
          {children}
        </div>
      )}
    </div>
  )
}

