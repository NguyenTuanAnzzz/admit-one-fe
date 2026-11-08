import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'

const ConfirmContext = createContext(null)

const buttonBase =
  'inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] px-5 text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
const cancelButton = `${buttonBase} border-button-secondary-line text-button-secondary-fg hover:border-fg hover:bg-button-secondary-hover`
const primaryButton = `${buttonBase} border-button-primary bg-button-primary text-button-primary-fg hover:border-button-primary-hover hover:bg-button-primary-hover`
const dangerButton = `${buttonBase} border-danger bg-danger text-fg-inverse hover:opacity-90`

/**
 * Hộp xác nhận của app thay cho window.confirm của trình duyệt.
 * Dùng thẻ <dialog> gốc mở bằng showModal(): trình duyệt tự giữ focus trong hộp, bấm Esc là đóng, có lớp nền mờ phía sau.
 * confirm({ title, message, confirmLabel, cancelLabel, tone }) trả Promise<boolean>: true khi bấm nút xác nhận,
 * false khi bấm Huỷ, bấm Esc hoặc bấm ra ngoài hộp.
 * tone 'danger' cho thao tác không hoàn tác được (xoá): nút đỏ, focus mặc định vào Huỷ để lỡ bấm Enter cũng không xoá.
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)
  const titleId = useId()
  const messageId = useId()

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ confirmLabel: 'Đồng ý', cancelLabel: 'Huỷ', tone: 'primary', ...options, resolve })
      }),
    [],
  )

  // Có yêu cầu thì mở hộp dạng modal. Đóng xong trình duyệt tự trả focus về nút đã bấm để mở.
  // showModal() tự focus nút đầu tiên (Huỷ), nên focus lại bằng tay sau khi mở: xoá thì vào Huỷ, còn lại vào nút xác nhận
  useEffect(() => {
    const dialog = dialogRef.current
    if (!request || !dialog) return
    if (!dialog.open) dialog.showModal()
    ;(request.tone === 'danger' ? cancelRef : confirmRef).current?.focus()
  }, [request])

  function close(result) {
    if (!request) return
    request.resolve(result)
    dialogRef.current?.close()
    setRequest(null)
  }

  const danger = request?.tone === 'danger'

  return (
    <ConfirmContext value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={request?.message ? messageId : undefined}
        // Esc: trình duyệt bắn sự kiện cancel. Chặn để tự đóng qua close(), Promise luôn được trả lời
        onCancel={(e) => {
          e.preventDefault()
          close(false)
        }}
        // Bấm vào lớp nền mờ (ngoài hộp) thì sự kiện rơi vào chính thẻ dialog
        onClick={(e) => e.target === e.currentTarget && close(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-card-line bg-surface p-0 text-fg backdrop:bg-overlay open:motion-safe:animate-[confirm-in_160ms_ease-out]"
      >
        {request && (
          <div className="p-card">
            <h2 id={titleId} className="text-subheading font-bold text-title">
              {request.title}
            </h2>
            {request.message && (
              <p id={messageId} className="mt-2 text-body-sm whitespace-pre-line text-fg-muted">
                {request.message}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button ref={cancelRef} type="button" onClick={() => close(false)} className={cancelButton}>
                {request.cancelLabel}
              </button>
              <button ref={confirmRef} type="button" onClick={() => close(true)} className={danger ? dangerButton : primaryButton}>
                {request.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext>
  )
}

/** const confirm = useConfirm(); if (!(await confirm({ title: 'Xoá?' }))) return */
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm phải dùng bên trong ConfirmProvider')
  return confirm
}
