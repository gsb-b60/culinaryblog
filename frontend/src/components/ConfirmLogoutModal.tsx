interface ConfirmLogoutModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmLogoutModal({
  onCancel,
  onConfirm,
}: ConfirmLogoutModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 p-5 backdrop-blur-sm"
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-7 text-center shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
          </svg>
        </div>
        <div className="mt-5">
          <h2
            id="logout-dialog-title"
            className="text-xl font-bold text-surface-900"
          >
            Bạn có chắc muốn đăng xuất?
          </h2>
          <p
            id="logout-dialog-description"
            className="mx-auto mt-2 max-w-sm text-sm leading-6 text-surface-500"
          >
            Phiên đăng nhập hiện tại sẽ được kết thúc trên thiết bị này.
          </p>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-lg border border-surface-300 px-5 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 flex-1 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
