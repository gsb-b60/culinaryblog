interface ConfirmLogoutModalProps {
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmLogoutModal({ onCancel, onConfirm }: ConfirmLogoutModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 p-5" role="presentation">
      <div className="w-full max-w-sm rounded-xl border border-surface-200 bg-white p-6 text-center shadow-xl" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <span className="text-xl font-bold">!</span>
        </div>
        <h2 id="logout-dialog-title" className="mt-4 text-lg font-bold text-surface-900">Bạn có chắc muốn đăng xuất?</h2>
        <p className="mt-2 text-sm text-surface-500">Phiên đăng nhập hiện tại sẽ được kết thúc trên thiết bị này.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-surface-300 px-5 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50">Hủy</button>
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">Đăng xuất</button>
        </div>
      </div>
    </div>
  )
}
