'use client'

import Link from 'next/link'
import { ArrowLeft, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  title: string
  onClear?: () => void
}

export function ChatHeader({ title, onClear }: ChatHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-semibold">{title}</span>
          </div>
        </div>
        
        {onClear && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="text-gray-500 hover:text-gray-900"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            履歴クリア
          </Button>
        )}
      </div>
    </header>
  )
}

