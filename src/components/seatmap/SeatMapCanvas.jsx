import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva'
import { SEAT_RADIUS, bounds, generateSeats, rectShape, seatKey, zoneShape } from '../../lib/seatLayout'

// Canvas không đọc được class Tailwind, nên lấy đúng mã màu từ tailwind.config.js
const COLOR = {
  ink: '#1d1a17',
  inkSoft: '#67615b',
  white: '#ffffff',
  sand: '#efede9',
  rule: '#e4e1dc',
  ruleStrong: '#c9c4bc',
  focus: '#1d1a17',
}

const OBJECT_STYLE = {
  STAGE: { fill: COLOR.ink, text: COLOR.white },
  SCREEN: { fill: COLOR.inkSoft, text: COLOR.white },
  FOH: { fill: COLOR.ink, text: COLOR.white },
  CLOSED_AREA: { fill: COLOR.ruleStrong, text: COLOR.ink },
  LABEL: { fill: 'transparent', text: COLOR.ink },
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 6

const flat = (shape) => shape.flat()

/** Ảnh nền tải bất đồng bộ. Giữ kèm url để đổi ảnh thì ảnh cũ không hiện nhầm, mà không phải setState trong effect */
function useBackground(url) {
  const [loaded, setLoaded] = useState({ url: null, img: null })
  useEffect(() => {
    if (!url) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setLoaded({ url, img })
    img.src = url
  }, [url])
  return loaded.url === url ? loaded.img : null
}

/**
 * Bản vẽ sơ đồ bằng Konva. Toạ độ trong data theo khung mapWidth x mapHeight, Stage co giãn theo bề rộng khung chứa.
 * mode "move": kéo khu và vật thể, bấm để chọn, khu đang chọn có tay cầm xoay (vật thể có thêm giãn).
 * mode "block": bấm ghế để khoá hoặc mở, khu không kéo được.
 * Cuộn chuột để phóng to quanh con trỏ, kéo nền để di chuyển cả sơ đồ.
 */
export function SeatMapCanvas({ map, tiersByKey, selected, mode, readOnly, viewRef, onSelect, onChangeZone, onChangeObject, onToggleSeat }) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const trRef = useRef(null)
  const nodeRefs = useRef({})
  const [width, setWidth] = useState(0)
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const background = useBackground(map.mapBackgroundUrl || null)

  // Theo dõi bề rộng khung chứa để Stage luôn vừa, kể cả khi thu nhỏ cửa sổ
  useEffect(() => {
    const el = containerRef.current
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = width ? width / map.mapWidth : 1
  const height = Math.round(map.mapHeight * fit)
  const scale = fit * view.zoom

  // Nút phóng to, thu nhỏ, vừa khung ở trang cha gọi qua viewRef
  useEffect(() => {
    if (!viewRef) return
    const zoomAt = (factor) =>
      setView((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
        // Giữ tâm khung đứng yên khi phóng bằng nút
        const cx = width / 2
        const cy = height / 2
        const k = zoom / v.zoom
        return { zoom, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
      })
    viewRef.current = { zoomIn: () => zoomAt(1.25), zoomOut: () => zoomAt(0.8), reset: () => setView({ zoom: 1, x: 0, y: 0 }) }
  }, [viewRef, width, height])

  // Gắn tay cầm vào khu hoặc vật thể đang chọn
  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const node = selected && mode === 'move' && !readOnly ? nodeRefs.current[selected.key] : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selected, mode, readOnly, map])

  function handleWheel(e) {
    e.evt.preventDefault()
    const stage = stageRef.current
    const pointer = stage.getPointerPosition()
    setView((v) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * (e.evt.deltaY < 0 ? 1.1 : 1 / 1.1)))
      const k = zoom / v.zoom
      // Phóng quanh con trỏ: điểm dưới con trỏ giữ nguyên vị trí trên màn hình
      return { zoom, x: pointer.x - (pointer.x - v.x) * k, y: pointer.y - (pointer.y - v.y) * k }
    })
  }

  // Bấm vào chỗ trống (nền) thì bỏ chọn
  function handleStageClick(e) {
    if (e.target === e.target.getStage() || e.target.name() === 'background') onSelect(null)
  }

  const zonesWithSeats = useMemo(
    () => map.zones.map((z) => ({ zone: z, shape: zoneShape(z), seats: z.rowCount && z.seatsPerRow ? generateSeats(z) : [] })),
    [map.zones],
  )

  const canMove = mode === 'move' && !readOnly
  const seatsListening = mode === 'block' && !readOnly

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
          onMouseDown={handleStageClick}
          onTouchStart={handleStageClick}
        >
          <Layer>
            {/* Nền trắng đúng khung sơ đồ, ảnh mặt bằng mờ phía trên để admin đặt khu cho khớp */}
            <Rect name="background" width={map.mapWidth} height={map.mapHeight} fill={COLOR.white} stroke={COLOR.rule} strokeWidth={1 / scale} />
            {background && <KonvaImage name="background" image={background} width={map.mapWidth} height={map.mapHeight} opacity={0.35} listening />}
          </Layer>

          <Layer>
            {map.objects.map((o) => {
              const style = OBJECT_STYLE[o.type] ?? OBJECT_STYLE.LABEL
              const isSelected = selected?.kind === 'object' && selected.key === o.key
              return (
                <Group
                  key={o.key}
                  ref={(node) => (nodeRefs.current[o.key] = node)}
                  x={o.x}
                  y={o.y}
                  rotation={o.rotation}
                  draggable={canMove}
                  onMouseDown={(e) => {
                    e.cancelBubble = true
                    if (mode === 'move') onSelect({ kind: 'object', key: o.key })
                  }}
                  onTap={() => mode === 'move' && onSelect({ kind: 'object', key: o.key })}
                  onDragEnd={(e) => onChangeObject(o.key, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
                  onTransformEnd={(e) => {
                    // Konva giãn bằng scale: đổi scale thành width, height rồi đặt scale về 1 để data không lưu scale
                    const node = e.target
                    const next = {
                      x: Math.round(node.x()),
                      y: Math.round(node.y()),
                      rotation: Math.round(node.rotation()),
                      width: Math.max(10, Math.round(o.width * node.scaleX())),
                      height: Math.max(10, Math.round(o.height * node.scaleY())),
                    }
                    node.scaleX(1)
                    node.scaleY(1)
                    onChangeObject(o.key, next)
                  }}
                >
                  <Line
                    points={flat(rectShape(o.width, o.height))}
                    closed
                    fill={style.fill}
                    stroke={isSelected ? COLOR.focus : o.type === 'LABEL' ? COLOR.ruleStrong : undefined}
                    strokeWidth={isSelected ? 2 / scale : 1 / scale}
                    dash={o.type === 'LABEL' ? [4 / scale, 4 / scale] : undefined}
                    cornerRadius={4}
                  />
                  <Text text={o.label} width={o.width} height={o.height} align="center" verticalAlign="middle" fontSize={Math.min(18, Math.max(9, o.height * 0.45))} fontStyle="bold" fill={style.text} listening={false} />
                </Group>
              )
            })}

            {zonesWithSeats.map(({ zone, shape, seats }) => {
              const tier = tiersByKey[zone.tierKey]
              const color = tier?.color ?? COLOR.ruleStrong
              const blocked = new Set(map.blocked[zone.key] ?? [])
              const box = bounds(shape)
              const isSelected = selected?.kind === 'zone' && selected.key === zone.key
              return (
                <Group
                  key={zone.key}
                  ref={(node) => (nodeRefs.current[zone.key] = node)}
                  x={zone.x}
                  y={zone.y}
                  rotation={zone.rotation}
                  draggable={canMove}
                  onMouseDown={(e) => {
                    e.cancelBubble = true
                    onSelect({ kind: 'zone', key: zone.key })
                  }}
                  onTap={() => onSelect({ kind: 'zone', key: zone.key })}
                  onDragEnd={(e) => onChangeZone(zone.key, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
                  onTransformEnd={(e) => onChangeZone(zone.key, { rotation: Math.round(e.target.rotation()) })}
                >
                  <Line points={flat(shape)} closed fill={color} opacity={0.16} listening />
                  <Line points={flat(shape)} closed stroke={isSelected ? COLOR.focus : color} strokeWidth={(isSelected ? 2.5 : 1.5) / scale} listening={false} />
                  <Text
                    text={`${zone.label}${tier ? ` · ${tier.name}` : ''}`}
                    x={box.minX}
                    y={box.minY - 18}
                    width={Math.max(box.width, 120)}
                    fontSize={13}
                    fontStyle="bold"
                    fill={COLOR.ink}
                    listening={false}
                  />
                  {seats.map((s) => {
                    const key = seatKey(s.rowLabel, s.seatNumber)
                    const isBlocked = blocked.has(key)
                    // key không nằm trong common: React cấm truyền key qua {...spread}
                    const common = {
                      listening: seatsListening,
                      perfectDrawEnabled: false,
                      // onClick chứ không onMouseDown: kéo nền đi qua ghế thì không khoá nhầm
                      onClick: (e) => {
                        e.cancelBubble = true
                        onToggleSeat(zone.key, key)
                      },
                      onTap: () => onToggleSeat(zone.key, key),
                    }
                    // Ghế khoá vẽ hình vuông xám, không chỉ khác màu, để người mù màu vẫn phân biệt được
                    return isBlocked ? (
                      <Rect key={key} {...common} x={s.x - SEAT_RADIUS} y={s.y - SEAT_RADIUS} width={SEAT_RADIUS * 2} height={SEAT_RADIUS * 2} fill={COLOR.ruleStrong} stroke={COLOR.ink} strokeWidth={1} cornerRadius={2} />
                    ) : (
                      <Circle key={key} {...common} x={s.x} y={s.y} radius={SEAT_RADIUS} fill={color} stroke={COLOR.white} strokeWidth={1.5} />
                    )
                  })}
                </Group>
              )
            })}

            <Transformer
              ref={trRef}
              rotateEnabled
              // Khu chỉ xoay (kích thước do số hàng, số ghế quyết định); vật thể xoay và giãn được
              enabledAnchors={selected?.kind === 'object' ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : []}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotationSnapTolerance={4}
              borderStroke={COLOR.focus}
              anchorStroke={COLOR.focus}
              anchorFill={COLOR.white}
              ignoreStroke
            />
          </Layer>
        </Stage>
      )}
    </div>
  )
}
