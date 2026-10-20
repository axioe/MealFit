import { Construction } from 'lucide-react'

interface PagePlaceholderProps {
  title: string
  owner: string
  description: string
  todos: string[]
  apis: string[]
}

/** 담당자가 구현하기 전까지 보여줄 안내 화면. 구현을 시작하면 이 컴포넌트를 지운다. */
export function PagePlaceholder({ title, owner, description, todos, apis }: PagePlaceholderProps) {
  return (
    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Construction className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">담당: {owner}</p>
        </div>
      </div>
      <p className="mb-6 text-sm text-gray-600">{description}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">구현할 것</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            {todos.map((todo) => (
              <li key={todo}>{todo}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">연동 API</h4>
          <ul className="space-y-1 font-mono text-xs text-gray-600">
            {apis.map((a) => (
              <li key={a} className="rounded bg-gray-50 px-2 py-1">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
