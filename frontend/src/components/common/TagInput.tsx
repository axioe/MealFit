import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface TagInputProps {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

/** 엔터 또는 쉼표로 항목 추가, X로 삭제 (알레르기·제외 재료 입력용) */
export function TagInput({ id, value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const tag = draft.trim().replace(/,$/, '')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return // 한글 조합 중 Enter 무시
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
          {tag}
          <button
            type="button"
            aria-label={`${tag} 삭제`}
            className="cursor-pointer text-emerald-600 hover:text-rose-600"
            onClick={() => onChange(value.filter((t) => t !== tag))}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-gray-400"
        value={draft}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
      />
    </div>
  )
}
