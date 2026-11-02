import { useEffect } from 'react'

/** Trang con của dashboard khi backend chưa có API: nói rõ trang sẽ làm gì và thuộc yêu cầu nào trong spec.md. */
export default function DashboardPlaceholder({ item }) {
  useEffect(() => {
    const previous = document.title
    document.title = `${item.label} · Dashboard · Admit One`
    return () => {
      document.title = previous
    }
  }, [item.label])

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-heading font-bold text-title">{item.label}</h1>
      <p className="mt-2 text-body-sm text-fg-muted">{item.description}</p>

      <div className="mt-6 rounded-card border border-dashed border-line-strong bg-surface p-card">
        <p className="text-body font-semibold text-title">Sắp có</p>
        <p className="mt-1 text-body-sm text-fg-muted">
          Trang này cần API ở backend trước. Yêu cầu trong đặc tả: <span className="font-semibold text-fg">{item.code}</span>.
        </p>
      </div>
    </div>
  )
}
