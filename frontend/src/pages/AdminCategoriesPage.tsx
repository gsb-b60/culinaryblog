import { useEffect, useState } from 'react'
import { PlusIcon, XIcon, FolderIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'

import { ApiError, createCategory, listCategories } from '@/lib/api'
import { useAuthStore } from '@/store'
import type { Category, CreateCategoryPayload } from '@/types/category'

export default function AdminCategoriesPage() {
  const session = useAuthStore((state) => state.session)
  const isAdmin = session?.user.roles.includes('ADMIN')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)

  // Form submission states
  const [saving, setSaving] = useState(false)
  const [error422, setError422] = useState<string | null>(null)
  const [error409, setError409] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listCategories()
      .then((data) => {
        if (!active) return
        setCategories(data)
      })
      .catch((err) => {
        if (!active) return
        setFetchError(err instanceof Error ? err.message : 'Không thể tải danh sách danh mục')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleOpenDialog = () => {
    setName('')
    setDescription('')
    setOrderIndex(categories.length)
    setError422(null)
    setError409(null)
    setGeneralError(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    if (saving) return
    setIsDialogOpen(false)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError422(null)
    setError409(null)
    setGeneralError(null)

    // Client-side pre-validation
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError422('Tên danh mục phải có độ dài từ 2 đến 50 ký tự.')
      return
    }

    if (/<[^>]*>/i.test(trimmedName)) {
      setError422('Tên danh mục không được chứa các thẻ HTML.')
      return
    }

    if (!session?.accessToken) {
      setGeneralError('Bạn cần đăng nhập với quyền Quản trị viên để tạo danh mục.')
      return
    }

    setSaving(true)
    try {
      const payload: CreateCategoryPayload = {
        name: trimmedName,
        description: description.trim() || undefined,
        orderIndex,
      }

      const created = await createCategory(session.accessToken, payload)
      setCategories((prev) => [...prev, created])
      setSuccessMessage(`Đã tạo danh mục "${created.name}" thành công!`)
      setIsDialogOpen(false)

      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError409(err.message || 'Danh mục với tên này đã tồn tại trong hệ thống.')
        } else if (err.status === 422) {
          setError422(err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại tên danh mục.')
        } else if (err.status === 403) {
          setGeneralError('Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Admin).')
        } else {
          setGeneralError(err.message || 'Có lỗi xảy ra khi tạo danh mục.')
        }
      } else {
        setGeneralError('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 md:text-3xl">
            Quản trị danh mục
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Quản lý các danh mục món ăn, phân loại và thứ tự hiển thị trên blog.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            data-testid="create-category-open-btn"
            onClick={handleOpenDialog}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Thêm danh mục</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          data-testid="success-banner"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2Icon className="h-5 w-5 text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Fetch Error Notification */}
      {fetchError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircleIcon className="h-5 w-5 text-red-600 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Categories Table (Desktop & Mobile) */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-surface-100 p-6 space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-surface-200 rounded" />
                  <div className="h-3 w-64 bg-surface-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-surface-200 rounded" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div
            data-testid="categories-empty-state"
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-400">
              <FolderIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">Chưa có danh mục nào</h3>
            <p className="mt-1 text-sm text-surface-500 max-w-sm">
              Hệ thống hiện chưa có danh mục nào được tạo. Hãy nhấn "Thêm danh mục" để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Danh mục</th>
                  <th scope="col" className="px-6 py-3.5">Mô tả</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Số công thức</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Thứ tự</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    data-testid={`category-row-${cat.id}`}
                    className="hover:bg-surface-50/70 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-surface-900">{cat.name}</div>
                      <div className="text-xs text-surface-400 font-mono mt-0.5">{cat.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-surface-500 max-w-xs truncate">
                      {cat.description || <span className="text-surface-300 italic">Không có mô tả</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {cat.recipeCount ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-surface-500 font-mono">
                      {cat.orderIndex ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs font-medium">
                        <span className="text-surface-400 hover:text-brand-600 cursor-pointer">Sửa</span>
                        <span className="text-surface-300">|</span>
                        <span className="text-surface-400 hover:text-rose-600 cursor-pointer">Xóa</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog: Thêm danh mục mới (Screen M13) */}
      {isDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          data-testid="create-category-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-surface-200">
            {/* Dialog Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-100">
              <h2 id="dialog-title" className="text-lg font-bold text-surface-900">
                Thêm danh mục mới
              </h2>
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={saving}
                aria-label="Đóng"
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Error banners inside modal */}
            {error422 && (
              <div
                role="alert"
                data-testid="create-category-error-422"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error422}</span>
              </div>
            )}

            {error409 && (
              <div
                role="alert"
                data-testid="create-category-error-409"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{error409}</span>
              </div>
            )}

            {generalError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Dialog Form */}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="category-name"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  required
                  disabled={saving}
                  data-testid="create-category-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Món lẩu, Món nướng..."
                  className="w-full rounded-lg border border-surface-300 px-3.5 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-surface-50"
                />
                <p className="mt-1 text-xs text-surface-400">
                  Từ 2 đến 50 ký tự, không chứa thẻ HTML. Slug sẽ được tự động tạo.
                </p>
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  disabled={saving}
                  data-testid="create-category-desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về nhóm món ăn này..."
                  className="w-full rounded-lg border border-surface-300 px-3.5 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-surface-50 resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="category-order"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Thứ tự sắp xếp
                </label>
                <input
                  id="category-order"
                  type="number"
                  min={0}
                  disabled={saving}
                  data-testid="create-category-order-input"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-surface-300 px-3.5 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-surface-50"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  disabled={saving}
                  data-testid="create-category-cancel-button"
                  className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="create-category-submit-button"
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <span>Tạo danh mục</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
