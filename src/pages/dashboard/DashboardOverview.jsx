import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getOrdersByStatus, getOverview, getRevenueByDay, getTopEvents } from '../../api/overviewApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/Spinner'
import { formatCount, formatMoney } from '../../lib/format'
import { ORDER_STATUS_LABEL } from '../../lib/orderStatus'

const card = 'rounded-card border border-card-line bg-surface p-card'

const STATS = [
  { key: 'totalRevenue', label: 'Doanh thu', format: (v) => formatMoney(Number(v)) },
  { key: 'ticketsSold', label: 'Vé đã bán', format: formatCount },
  { key: 'ticketsHeld', label: 'Vé đang giữ', format: formatCount },
]

// Màu theo đúng bảng màu của design system (tailwind.config.js), recharts cần mã màu thật chứ không nhận class Tailwind
const COLOR_REVENUE = '#cf3a20' // coral (action)
const STATUS_COLOR = {
  PENDING: '#cf3a20',
  PAID: '#177245',
  EXPIRED: '#9a948d',
  CANCELLED: '#b2331c',
}

const shortMoney = (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}tr` : v >= 1_000 ? `${Math.round(v / 1000)}k` : String(v))
const shortDay = (iso) => iso.slice(5) // "2026-11-14" -> "11-14"

function ChartCard({ title, children, empty }) {
  return (
    <div className={card}>
      <h2 className="text-subheading font-bold text-title">{title}</h2>
      <div className="mt-4 h-64">
        {empty ? <p className="flex h-full items-center justify-center text-body-sm text-fg-muted">{empty}</p> : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}
      </div>
    </div>
  )
}

/**
 * Dashboard › Tổng quan (A-04): 3 ô số liệu + 3 biểu đồ (doanh thu theo ngày, đơn theo trạng thái, top sự kiện).
 * Không có "độ dài hàng đợi" vì bài phòng chờ ảo (5.4) đã bỏ.
 */
export default function DashboardOverview() {
  const { fetchWithAuth } = useAuth()
  const [data, setData] = useState(null)
  const [revenueByDay, setRevenueByDay] = useState(null)
  const [ordersByStatus, setOrdersByStatus] = useState(null)
  const [topEvents, setTopEvents] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    setError(null)
    Promise.all([getOverview(fetchWithAuth), getRevenueByDay(fetchWithAuth), getOrdersByStatus(fetchWithAuth), getTopEvents(fetchWithAuth)])
      .then(([overview, revenue, status, events]) => {
        setData(overview)
        setRevenueByDay(revenue)
        setOrdersByStatus(status)
        setTopEvents(events)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = 'Tổng quan · Dashboard · Admit One'
    return () => {
      document.title = previous
    }
  }, [])

  const hasOrders = ordersByStatus && ordersByStatus.some((s) => s.count > 0)
  const hasTopEvents = topEvents && topEvents.length > 0

  return (
    <div>
      <h1 className="font-display text-heading font-bold text-title">Tổng quan</h1>
      <p className="mt-2 text-body-sm text-fg-muted">Doanh thu, số vé bán và số vé đang giữ trên toàn hệ thống.</p>

      {error && (
        <div role="alert" className="mt-6 rounded-input bg-danger-subtle px-4 py-3 text-body-sm text-danger">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-3 inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-button-secondary-line px-5 text-body-sm font-semibold text-button-secondary-fg hover:border-fg">
            Thử lại
          </button>
        </div>
      )}

      {!error && !data && (
        <p role="status" className="mt-6 flex items-center gap-2 text-body-sm text-fg-muted">
          <Spinner /> Đang tải...
        </p>
      )}

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.key} className={card}>
              <p className="text-body-sm text-fg-muted">{stat.label}</p>
              <p className="mt-2 text-heading font-bold text-title">{stat.format(data[stat.key])}</p>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Doanh thu 14 ngày gần nhất">
            <LineChart data={revenueByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDay} fontSize={12} />
              <YAxis tickFormatter={shortMoney} fontSize={12} width={48} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} labelFormatter={shortDay} />
              <Line type="monotone" dataKey="revenue" stroke={COLOR_REVENUE} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Đơn hàng theo trạng thái" empty={!hasOrders ? 'Chưa có đơn nào' : null}>
            <PieChart>
              <Pie data={ordersByStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {ordersByStatus?.map((s) => (
                  <Cell key={s.status} fill={STATUS_COLOR[s.status]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, _n, { payload }) => [formatCount(v), ORDER_STATUS_LABEL[payload.status] ?? payload.status]} />
            </PieChart>
          </ChartCard>

          <ChartCard title="Top sự kiện theo doanh thu" empty={!hasTopEvents ? 'Chưa có sự kiện nào có doanh thu' : null}>
            <BarChart data={topEvents} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={shortMoney} fontSize={12} />
              <YAxis type="category" dataKey="eventName" width={110} fontSize={12} tick={{ width: 100 }} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} />
              <Bar dataKey="revenue" fill={COLOR_REVENUE} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
