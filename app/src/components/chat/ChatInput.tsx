'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
  multiline?: boolean
}

export function ChatInput({
  onSend,
  placeholder = 'メッセージを入力...',
  disabled = false,
  multiline = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自動リサイズ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[44px] max-h-[200px] resize-none bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 rounded-xl pr-12"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {multiline && (
          <p className="text-xs text-gray-500 mt-2">
            Shift + Enter で改行
          </p>
        )}
      </div>
    </div>
  )
}

