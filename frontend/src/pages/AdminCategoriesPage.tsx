import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'

import { ApiError, createCategory, deleteCategory, listCategories, updateCategory } from '@/lib/api'
import { useAuthStore } from '@/store'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category'

type SortField = 'orderIndex' | 'name' | 'recipeCount'
type SortOrder = 'asc' | 'desc'
type DialogMode = 'create' | 'edit'

/** Pastel color palette for category badges — cycles by index */
const CATEGORY_COLORS = [
  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
  { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-400' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-400' },
  { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
]

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

function SortIndicator({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField
  sortField: SortField
  sortOrder: SortOrder
}) {
  if (sortField !== field) return <ArrowUpDownIcon className="h-3.5 w-3.5 text-surface-400" />
  return sortOrder === 'asc' ? (
    <ArrowUpIcon className="h-3.5 w-3.5 text-brand-500" />
  ) : (
    <ArrowDownIcon className="h-3.5 w-3.5 text-brand-500" />
  )
}

function slugifyPreview(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminCategoriesPage() {
  const session = useAuthStore((state) => state.session)
  const isAdmin = session?.user.roles.includes('ADMIN')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('orderIndex')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Dialog state (shared for create & edit)
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)

  // Delete confirm dialog
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
        setCategories(Array.isArray(data) ? data : (data as { items?: Category[] })?.items ?? [])
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

  // ── Helpers ──────────────────────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const clearFormErrors = () => {
    setError422(null)
    setError409(null)
    setGeneralError(null)
  }

  // ── Create dialog ─────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setDialogMode('create')
    setEditingCategory(null)
    setName('')
    setDescription('')
    setOrderIndex(categories.length)
    clearFormErrors()
    setIsDialogOpen(true)
  }

  // ── Edit dialog ───────────────────────────────────────────────────────────

  const handleOpenEdit = (cat: Category) => {
    setDialogMode('edit')
    setEditingCategory(cat)
    setName(cat.name)
    setDescription(cat.description ?? '')
    setOrderIndex(cat.orderIndex ?? 0)
    clearFormErrors()
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    if (saving) return
    setIsDialogOpen(false)
    setEditingCategory(null)
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = categories.filter((cat) => {
      if (!q) return true
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
      )
    })

    return filtered.sort((a, b) => {
      let comparison = 0
      if (sortField === 'orderIndex') {
        comparison = (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      } else if (sortField === 'recipeCount') {
        comparison = (a.recipeCount ?? 0) - (b.recipeCount ?? 0)
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'vi')
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [categories, searchQuery, sortField, sortOrder])

  // ── Submit (create or edit) ───────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFormErrors()

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
      setGeneralError('Bạn cần đăng nhập với quyền Quản trị viên để thực hiện thao tác này.')
      return
    }

    setSaving(true)
    try {
      if (dialogMode === 'create') {
        const payload: CreateCategoryPayload = {
          name: trimmedName,
          description: description.trim() || undefined,
          orderIndex,
        }
        const created = await createCategory(session.accessToken, payload)
        setCategories((prev) => [...prev, created])
        showSuccess(`Đã tạo danh mục "${created.name}" thành công!`)
      } else if (editingCategory) {
        const payload: UpdateCategoryPayload = {
          name: trimmedName,
          description: description.trim() || undefined,
          orderIndex,
        }
        await updateCategory(session.accessToken, editingCategory.id, payload)
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? {
                  ...c,
                  name: trimmedName,
                  description: description.trim() || undefined,
                  orderIndex,
                  slug: slugifyPreview(trimmedName),
                }
              : c,
          ),
        )
        showSuccess(`Đã cập nhật danh mục "${trimmedName}" thành công!`)
      }
      setIsDialogOpen(false)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError409(err.message || 'Danh mục với tên này đã tồn tại trong hệ thống.')
        } else if (err.status === 422) {
          setError422(err.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại tên danh mục.')
        } else if (err.status === 403) {
          setGeneralError('Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Admin).')
        } else {
          setGeneralError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        }
      } else {
        setGeneralError('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deletingCategory || !session?.accessToken) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteCategory(session.accessToken, deletingCategory.id)
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id))
      showSuccess(`Đã xóa danh mục "${deletingCategory.name}" thành công.`)
      setDeletingCategory(null)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setDeleteError(err.message || 'Không thể xóa danh mục này.')
      } else {
        setDeleteError('Không thể kết nối đến máy chủ.')
      }
    } finally {
      setDeleting(false)
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const totalRecipes = useMemo(
    () => categories.reduce((sum, cat) => sum + (cat.recipeCount ?? 0), 0),
    [categories],
  )

  const previewSlug = useMemo(() => slugifyPreview(name), [name])

  // Map category id → palette index (stable across re-renders)
  const colorMap = useMemo(() => {
    const map = new Map<string, number>()
    categories.forEach((cat, i) => map.set(cat.id, i))
    return map
  }, [categories])


  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded bg-brand-500 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              M13
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 md:text-3xl">
              Quản trị danh mục
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-surface-500">
            Quản lý các danh mục món ăn, phân loại và thứ tự hiển thị trên blog.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            data-testid="create-category-open-btn"
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Thêm danh mục</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-surface-500">Tổng danh mục</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{categories.length}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-surface-500">Tổng công thức</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{totalRecipes}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-surface-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
            <FolderIcon className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500">Trung bình / danh mục</p>
            <p className="mt-0.5 text-lg font-bold text-surface-900">
              {categories.length
                ? (totalRecipes / categories.length).toFixed(1)
                : '0'}{' '}
              <span className="text-xs font-normal text-surface-400">công thức</span>
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          data-testid="success-banner"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 animate-in fade-in"
        >
          <CheckCircle2Icon className="h-5 w-5 text-green-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
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

      {/* Search + Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm danh mục theo tên, mô tả hoặc slug..."
            className="w-full rounded-xl border border-surface-200 bg-white pl-10 pr-9 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              aria-label="Xóa tìm kiếm"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-surface-500 text-right shrink-0">
          Hiển thị{' '}
          <span className="font-semibold text-surface-900">
            {filteredAndSortedCategories.length}
          </span>{' '}
          / {categories.length} danh mục
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-surface-100 p-6 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <div className="space-y-2">
                  <div className="h-4 w-44 bg-surface-200 rounded" />
                  <div className="h-3 w-64 bg-surface-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-surface-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedCategories.length === 0 ? (
          <div
            data-testid="categories-empty-state"
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-400">
              <FolderIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">
              {searchQuery ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}
            </h3>
            <p className="mt-1 text-sm text-surface-500 max-w-sm">
              {searchQuery
                ? `Không có kết quả nào khớp với "${searchQuery}". Hãy thử tìm kiếm từ khóa khác.`
                : 'Hệ thống hiện chưa có danh mục nào. Hãy nhấn "Thêm danh mục" để bắt đầu.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500 uppercase tracking-wider select-none">
                <tr>
                  <th
                    scope="col"
                    onClick={() => handleSort('name')}
                    className="px-6 py-3.5 cursor-pointer hover:text-surface-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Danh mục</span>
                      <SortIndicator field="name" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 hidden sm:table-cell">
                    Mô tả
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('recipeCount')}
                    className="px-6 py-3.5 text-center cursor-pointer hover:text-surface-800 transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Số công thức</span>
                      <SortIndicator field="recipeCount" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('orderIndex')}
                    className="px-6 py-3.5 text-center cursor-pointer hover:text-surface-800 transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Thứ tự</span>
                      <SortIndicator field="orderIndex" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredAndSortedCategories.map((cat) => {
                  const colorIdx = colorMap.get(cat.id) ?? 0
                  const color = getCategoryColor(colorIdx)
                  return (
                    <tr
                      key={cat.id}
                      data-testid={`category-row-${cat.id}`}
                      className="hover:bg-surface-50/80 transition group"
                    >
                      {/* Name + slug */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.bg}`}
                          >
                            <div className={`h-3 w-3 rounded-sm ${color.dot}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-surface-900">{cat.name}</div>
                            <div className="text-xs text-surface-400 font-mono mt-0.5">
                              {cat.slug}
                            </div>
                            {cat.description && (
                              <p className="mt-1 text-xs text-surface-500 truncate max-w-xs sm:hidden">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Description (desktop) */}
                      <td className="px-6 py-4 text-surface-500 max-w-xs truncate hidden sm:table-cell text-sm">
                        {cat.description || (
                          <span className="text-surface-300 italic text-xs">Không có mô tả</span>
                        )}
                      </td>

                      {/* Recipe count */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}
                        >
                          {cat.recipeCount ?? 0}
                        </span>
                      </td>

                      {/* Order index */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-surface-200 bg-surface-50 text-xs font-semibold text-surface-600 font-mono">
                          {cat.orderIndex ?? 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                aria-label={`Chỉnh sửa ${cat.name}`}
                                onClick={() => handleOpenEdit(cat)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:text-brand-600 hover:bg-brand-50 transition"
                              >
                                <PencilIcon className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Sửa</span>
                              </button>
                              <button
                                type="button"
                                aria-label={`Xóa ${cat.name}`}
                                onClick={() => {
                                  setDeleteError(null)
                                  setDeletingCategory(cat)
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2Icon className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Xóa</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      {isDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          data-testid="create-category-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDialog()
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-surface-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-100">
              <div>
                <h2 id="dialog-title" className="text-lg font-bold text-surface-900">
                  {dialogMode === 'create' ? 'Thêm danh mục mới' : `Chỉnh sửa: ${editingCategory?.name}`}
                </h2>
                <p className="text-xs text-surface-400 mt-0.5">
                  {dialogMode === 'create'
                    ? 'Tạo phân loại công thức mới cho hệ thống blog.'
                    : 'Cập nhật thông tin danh mục hiện có.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={saving}
                aria-label="Đóng"
                className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Error banners */}
            {error422 && (
              <div
                role="alert"
                data-testid="create-category-error-422"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{error422}</span>
              </div>
            )}

            {error409 && (
              <div
                role="alert"
                data-testid="create-category-error-409"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span className="font-medium">{error409}</span>
              </div>
            )}

            {generalError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium">{generalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="category-name" className="block text-sm font-medium text-surface-700">
                    Tên danh mục <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      name.trim().length > 50
                        ? 'text-rose-600 font-semibold'
                        : name.trim().length < 2
                          ? 'text-surface-400'
                          : 'text-green-600 font-medium'
                    }`}
                  >
                    {name.trim().length}/50 ký tự
                  </span>
                </div>
                <input
                  id="category-name"
                  type="text"
                  required
                  disabled={saving}
                  data-testid="create-category-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Món lẩu, Món cuốn, Đồ uống..."
                  className="w-full rounded-xl border border-surface-300 px-3.5 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-surface-50 transition"
                />
                {previewSlug ? (
                  <p className="mt-1.5 text-xs text-surface-500 flex items-center gap-1.5">
                    <span>Slug dự kiến:</span>
                    <code className="bg-surface-100 text-brand-600 px-1.5 py-0.5 rounded font-mono text-[11px]">
                      {previewSlug}
                    </code>
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-surface-400">
                    Từ 2 đến 50 ký tự. Slug sẽ được tự động tạo từ tên.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Mô tả <span className="text-surface-400 font-normal">(tùy chọn)</span>
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  disabled={saving}
                  data-testid="create-category-desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về nhóm món ăn này..."
                  className="w-full rounded-xl border border-surface-300 px-3.5 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-surface-50 resize-none transition"
                />
              </div>

              <div>
                <label
                  htmlFor="category-order"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Thứ tự sắp xếp
                  <span className="ml-1 text-surface-400 font-normal text-xs">(số nhỏ hiển thị trước)</span>
                </label>
                <input
                  id="category-order"
                  type="number"
                  min={0}
                  disabled={saving}
                  data-testid="create-category-order-input"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-32 rounded-xl border border-surface-300 px-3.5 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-surface-50 transition"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  disabled={saving}
                  data-testid="create-category-cancel-button"
                  className="rounded-xl border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="create-category-submit-button"
                  className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{dialogMode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}</span>
                    </>
                  ) : (
                    <span>{dialogMode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      {deletingCategory && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          data-testid="delete-category-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-surface-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <TriangleAlertIcon className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h2 id="delete-dialog-title" className="text-base font-bold text-surface-900">
                  Xác nhận xóa danh mục
                </h2>
                <p className="mt-1 text-sm text-surface-500">
                  Bạn có chắc muốn xóa danh mục{' '}
                  <strong className="text-surface-800">"{deletingCategory.name}"</strong>?
                  {(deletingCategory.recipeCount ?? 0) > 0 && (
                    <span className="mt-1.5 block text-amber-700 font-medium">
                      ⚠ Danh mục này đang có {deletingCategory.recipeCount} công thức liên kết.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={deleting}
                className="rounded-xl border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                data-testid="delete-category-confirm-button"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60 flex items-center gap-2 shadow-sm"
              >
                {deleting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa danh mục</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
