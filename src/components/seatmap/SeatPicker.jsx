import { useEffect, useRef, useState } from 'react'
import { Circle, Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import { SEAT_RADIUS, bounds, rectShape } from '../../lib/seatLayout'

// Canvas không đọc được class Tailwind, nên lấy đúng mã màu từ tailwind.config.js (giống SeatMapCanvas)
const COLOR = {
  ink: '#1d1a17',
  inkSoft: '#67615b',
  white: '#ffffff',
  rule: '#e4e1dc',
  ruleStrong: '#c9c4bc',
}

const OBJECT_STYLE = {
  STAGE: { fill: COLOR.ink, text: COLOR.white },
  SCREEN: { fill: COLOR.inkSoft, text: COLOR.white },
  FOH: { fill: COLOR.ink, text: COLOR.white },
  CLOSED_AREA: { fill: COLOR.ruleStrong, text: COLOR.ink },
  LABEL: { fill: 'transparent', text: COLOR.ink },
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 8
const flat = (shape) => shape.flat()

/**
 * Sơ đồ chọn ghế cho khách (C-04): tổng quan các khu, bấm khu thì phóng vào và hiện ghế thật của khu đó.
 * Ghế theo trạng thái: tròn màu hạng vé (trống), tròn viền (đang có người giữ), chấm xám (đã bán), ô vuông xám (khoá).
 * Hình khác nhau chứ không chỉ khác màu, để người mù màu vẫn phân biệt được. Danh sách chọn bằng HTML nằm ở trang cha.
 */
export function SeatPicker({ seatMap, tiersById, activeZoneId, zoneSeats, selectedIds, canSelect, viewRef, onOpenZone, onToggleSeat }) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const layerRef = useRef(null)
  const zoneRefs = useRef({})
  const [width, setWidth] = useState(0)
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })

  useEffect(() => {
    const el = containerRef.current
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const mapWidth = seatMap.mapWidth ?? 1200
  const mapHeight = seatMap.mapHeight ?? 800
  const fit = width ? width / mapWidth : 1
  const height = Math.round(mapHeight * fit)
  const scale = fit * view.zoom

  // Mở khu: căn khu vào giữa khung và phóng to cho vừa. Đóng khu: về toàn cảnh
  useEffect(() => {
    if (!width) return
    const node = activeZoneId ? zoneRefs.current[activeZoneId] : null
    if (!node || !layerRef.current) {
      setView({ zoom: 1, x: 0, y: 0 })
      return
    }
    const box = node.getClientRect({ relativeTo: layerRef.current })
    const pad = 48
    const zoom = Math.min(MAX_ZOOM, Math.max(1, Math.min(width / (box.width + pad), height / (box.height + pad)) / fit))
    const s = fit * zoom
    setView({ zoom, x: width / 2 - (box.x + box.width / 2) * s, y: height / 2 - (box.y + box.height / 2) * s })
  }, [activeZoneId, width, height, fit])

  useEffect(() => {
    if (!viewRef) return
    const zoomAt = (factor) =>
      setView((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
        const k = zoom / v.zoom
        return { zoom, x: width / 2 - (width / 2 - v.x) * k, y: height / 2 - (height / 2 - v.y) * k }
      })
    viewRef.current = { zoomIn: () => zoomAt(1.25), zoomOut: () => zoomAt(0.8) }
  }, [viewRef, width, height])

  function handleWheel(e) {
    e.evt.preventDefault()
    const pointer = stageRef.current.getPointerPosition()
    setView((v) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * (e.evt.deltaY < 0 ? 1.1 : 1 / 1.1)))
      const k = zoom / v.zoom
      return { zoom, x: pointer.x - (pointer.x - v.x) * k, y: pointer.y - (pointer.y - v.y) * k }
    })
  }

  // Con trỏ hình bàn tay trên khu và ghế bấm được
  const setCursor = (cursor) => {
    if (stageRef.current) stageRef.current.container().style.cursor = cursor
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-card border border-card-line bg-surface-sunken">
      {width > 0 && (
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          x={view.x}
          y={view.y}
          scaleX={scale}
          scaleY={scale}
          draggable
          onDragEnd={(e) => e.target === e.target.getStage() && setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }))}
          onWheel={handleWheel}
        >
          <Layer listening={false}>
            <Rect width={mapWidth} height={mapHeight} fill={COLOR.white} />
            {seatMap.objects.map((o) => {
              const style = OBJECT_STYLE[o.type] ?? OBJECT_STYLE.LABEL
              const b = bounds(o.shape)
              return (
                <Group key={o.id} x={o.x} y={o.y} rotation={o.rotation}>
                  <Line points={flat(o.shape.length ? o.shape : rectShape(b.width, b.height))} closed fill={style.fill} cornerRadius={4} />
                  <Text text={o.label ?? ''} width={b.width} height={b.height} align="center" verticalAlign="middle" fontSize={Math.min(18, Math.max(9, b.height * 0.45))} fontStyle="bold" fill={style.text} />
                </Group>
              )
            })}
          </Layer>

          <Layer ref={layerRef}>
            {seatMap.zones.map((zone) => {
              const tier = tiersById[zone.tierId]
              const color = tier?.color ?? COLOR.ruleStrong
              const box = bounds(zone.shape)
              const active = zone.id === activeZoneId
              const dimmed = activeZoneId && !active
              const seats = active ? zoneSeats[zone.id]?.seats : null
              const soldOut = zone.availableSeats === 0
              return (
                <Group
                  key={zone.id}
                  ref={(node) => (zoneRefs.current[zone.id] = node)}
                  x={zone.x}
                  y={zone.y}
                  rotation={zone.rotation}
                  opacity={dimmed ? 0.35 : 1}
                  onClick={() => !active && onOpenZone(zone.id)}
                  onTap={() => !active && onOpenZone(zone.id)}
                  onMouseEnter={() => !active && setCursor('pointer')}
                  onMouseLeave={() => setCursor('')}
                >
                  <Line points={flat(zone.shape)} closed fill={soldOut ? COLOR.ruleStrong : color} opacity={active ? 0.12 : 0.45} />
                  <Line points={flat(zone.shape)} closed stroke={active ? COLOR.ink : color} strokeWidth={(active ? 2 : 1.5) / scale} listening={false} />
                  {!seats && (
                    <Text
                      text={`${zone.label}\n${soldOut ? 'Hết vé' : `Còn ${zone.availableSeats}`}`}
                      x={box.minX}
                      y={box.minY}
                      width={box.width}
                      height={box.height}
                      align="center"
                      verticalAlign="middle"
                      fontSize={Math.max(10, Math.min(16, box.height / 4))}
                      fontStyle="bold"
                      fill={COLOR.ink}
                      listening={false}
                    />
                  )}
                  {seats?.map((s) => {
                    const isSelected = selectedIds.has(s.id)
                    const clickable = isSelected || (canSelect && s.status === 'AVAILABLE')
                    const handlers = clickable
                      ? {
                          onClick: (e) => {
                            e.cancelBubble = true
                            onToggleSeat(zone.id, s)
                          },
                          onTap: (e) => {
                            e.cancelBubble = true
                            onToggleSeat(zone.id, s)
                          },
                          onMouseEnter: () => setCursor('pointer'),
                          onMouseLeave: () => setCursor(''),
                        }
                      : { listening: false }
                    if (s.status === 'BLOCKED') {
                      return <Rect key={s.id} x={s.x - SEAT_RADIUS} y={s.y - SEAT_RADIUS} width={SEAT_RADIUS * 2} height={SEAT_RADIUS * 2} fill={COLOR.ruleStrong} cornerRadius={2} perfectDrawEnabled={false} {...handlers} />
                    }
                    if (s.status === 'SOLD') {
                      return <Circle key={s.id} x={s.x} y={s.y} radius={SEAT_RADIUS * 0.55} fill={COLOR.ruleStrong} perfectDrawEnabled={false} {...handlers} />
                    }
                    if (s.status === 'HELD' && !isSelected) {
                      return <Circle key={s.id} x={s.x} y={s.y} radius={SEAT_RADIUS - 1} fill={COLOR.white} stroke={color} strokeWidth={2} dash={[3, 2]} perfectDrawEnabled={false} {...handlers} />
                    }
                    return (
                      <Circle
                        key={s.id}
                        x={s.x}
                        y={s.y}
                        radius={SEAT_RADIUS}
                        fill={isSelected ? COLOR.ink : color}
                        stroke={COLOR.white}
                        strokeWidth={isSelected ? 3 : 1.5}
                        perfectDrawEnabled={false}
                        {...handlers}
                      />
                    )
                  })}
                </Group>
              )
            })}
          </Layer>
        </Stage>
      )}
    </div>
  )
}
