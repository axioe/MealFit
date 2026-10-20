export function Spinner({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="불러오는 중"
      className={`animate-spin rounded-full border-4 border-emerald-600 border-t-transparent ${className}`}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Spinner />
    </div>
  )
}
