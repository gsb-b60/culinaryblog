import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  addRecipeIngredient,
  ApiError,
  deleteRecipeIngredient,
  getManageableRecipes,
  getRecipeIngredients,
  logout,
  updateRecipeIngredient,
} from '../lib/api'
import type { RecipeIngredient, RecipeSummary } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'

interface IngredientForm {
  name: string
  quantity: string
  unit: string
  notes: string
}

const EMPTY_FORM: IngredientForm = { name: '', quantity: '', unit: '', notes: '' }

function describeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

function toInput(ingredient: RecipeIngredient): IngredientForm {
  return {
    name: ingredient.name,
    quantity: ingredient.quantity === undefined ? '' : String(ingredient.quantity),
    unit: ingredient.unit ?? '',
    notes: ingredient.notes ?? '',
  }
}

function toPayload(form: IngredientForm, orderIndex: number) {
  const quantity = form.quantity.trim()
  return {
    name: form.name.trim(),
    ...(quantity ? { quantity: Number(quantity) } : {}),
    ...(form.unit.trim() ? { unit: form.unit.trim() } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    orderIndex,
  }
}

export default function IngredientManagementPage() {
  const session = loadSession()
  const accessToken = session?.accessToken
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [recipePage, setRecipePage] = useState(1)
  const [recipeTotalPages, setRecipeTotalPages] = useState(1)
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<IngredientForm>(EMPTY_FORM)
  const [addForm, setAddForm] = useState<IngredientForm>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadIngredients, setReloadIngredients] = useState(0)

  useEffect(() => {
    if (!accessToken) return
    let active = true

    getManageableRecipes(accessToken, recipePage)
      .then((result) => {
        if (!active) return
        setRecipes(result.items)
        setRecipeTotalPages(result.meta.totalPages)
        const nextRecipeId = result.items[0]?.id ?? ''
        setIngredients([])
        setLoadingIngredients(Boolean(nextRecipeId))
        setSelectedRecipeId(nextRecipeId)
      })
      .catch((reason: unknown) => {
        if (active) setError(describeError(reason))
      })
      .finally(() => {
        if (active) setLoadingRecipes(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, recipePage])

  useEffect(() => {
    if (!accessToken || !selectedRecipeId) return

    let active = true
    getRecipeIngredients(accessToken, selectedRecipeId)
      .then((result) => {
        if (active) setIngredients(result)
      })
      .catch((reason: unknown) => {
        if (active) setError(describeError(reason))
      })
      .finally(() => {
        if (active) setLoadingIngredients(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, selectedRecipeId, reloadIngredients])

  if (!session) return <Navigate to="/auth/login" replace />

  const changePage = (page: number) => {
    setRecipePage(page)
    setSelectedRecipeId('')
    setIngredients([])
    setLoadingRecipes(true)
    setLoadingIngredients(false)
    setError('')
  }

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accessToken || !selectedRecipeId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await addRecipeIngredient(
        accessToken,
        selectedRecipeId,
        toPayload(addForm, ingredients.length),
      )
      setAddForm(EMPTY_FORM)
      setNotice('Đã thêm nguyên liệu.')
      setLoadingIngredients(true)
      setReloadIngredients((count) => count + 1)
    } catch (reason) {
      setError(describeError(reason))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (ingredient: RecipeIngredient) => {
    if (!accessToken || !selectedRecipeId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await updateRecipeIngredient(
        accessToken,
        selectedRecipeId,
        ingredient.id,
        toPayload(editForm, ingredient.orderIndex),
      )
      setEditingId(null)
      setNotice('Đã cập nhật nguyên liệu.')
      setLoadingIngredients(true)
      setReloadIngredients((count) => count + 1)
    } catch (reason) {
      setError(describeError(reason))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !selectedRecipeId || !deleteId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await deleteRecipeIngredient(accessToken, selectedRecipeId, deleteId)
      setDeleteId(null)
      setNotice('Đã xóa nguyên liệu.')
      setLoadingIngredients(true)
      setReloadIngredients((count) => count + 1)
    } catch (reason) {
      setError(describeError(reason))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (session) void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    window.location.assign('/')
  }

  const ingredientForm = (
    form: IngredientForm,
    setForm: (form: IngredientForm) => void,
    prefix: string,
  ) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-surface-700">
        Tên nguyên liệu
        <input
          required
          maxLength={200}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm"
          aria-label={`${prefix} - Tên nguyên liệu`}
        />
      </label>
      <label className="text-sm font-medium text-surface-700">
        Số lượng
        <input
          type="number"
          min="0.001"
          max="999999.999"
          step="any"
          value={form.quantity}
          onChange={(event) => setForm({ ...form, quantity: event.target.value })}
          className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm"
          aria-label={`${prefix} - Số lượng`}
        />
      </label>
      <label className="text-sm font-medium text-surface-700">
        Đơn vị
        <input
          maxLength={50}
          value={form.unit}
          onChange={(event) => setForm({ ...form, unit: event.target.value })}
          className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm"
          aria-label={`${prefix} - Đơn vị`}
        />
      </label>
      <label className="text-sm font-medium text-surface-700">
        Ghi chú
        <input
          maxLength={500}
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm"
          aria-label={`${prefix} - Ghi chú`}
        />
      </label>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div>
          <span className="text-sm font-bold text-white">Dashboard</span>
        </div>
        <nav className="space-y-1" aria-label="Dashboard menu">
          <Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Tổng quan</Link>
          <Link to="/dashboard/ingredients" className="block rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">Nguyên liệu</Link>
          <Link to="/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Hồ sơ</Link>
        </nav>
        <button type="button" onClick={handleLogout} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-700">Đăng xuất</button>
      </aside>

      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-500">Quản lý công thức</p>
            <h1 className="text-2xl font-bold text-surface-900">Quản lý nguyên liệu</h1>
          </div>
          <Link to="/dashboard" className="text-sm font-medium text-brand-600">← Tổng quan</Link>
        </header>

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

        <section className="mb-5 rounded-xl border border-surface-200 bg-white p-5">
          <label htmlFor="recipe-select" className="mb-2 block text-sm font-medium text-surface-700">Chọn công thức</label>
          <select
            id="recipe-select"
            value={selectedRecipeId}
            disabled={loadingRecipes || recipes.length === 0}
            onChange={(event) => {
              setSelectedRecipeId(event.target.value)
              setIngredients([])
              setLoadingIngredients(Boolean(event.target.value))
              setEditingId(null)
              setError('')
              setNotice('')
            }}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">{loadingRecipes ? 'Đang tải công thức…' : 'Chọn một công thức'}</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title} — {recipe.status === 'PUBLISHED' ? 'Đã xuất bản' : recipe.status === 'DRAFT' ? 'Bản nháp' : 'Đã lưu trữ'}
              </option>
            ))}
          </select>
          {!loadingRecipes && recipes.length === 0 && !error && (
            <p className="mt-2 text-sm text-surface-500">Bạn chưa có công thức nào để quản lý.</p>
          )}
          {recipeTotalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <button type="button" disabled={recipePage <= 1 || loadingRecipes} onClick={() => changePage(recipePage - 1)} className="text-brand-600 disabled:text-surface-300">Trang trước</button>
              <span>Trang {recipePage} / {recipeTotalPages}</span>
              <button type="button" disabled={recipePage >= recipeTotalPages || loadingRecipes} onClick={() => changePage(recipePage + 1)} className="text-brand-600 disabled:text-surface-300">Trang sau</button>
            </div>
          )}
        </section>

        {selectedRecipeId && (
          <>
            <section className="mb-5 rounded-xl border border-surface-200 bg-white p-5">
              <h2 className="mb-4 font-bold text-surface-900">Thêm nguyên liệu</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                {ingredientForm(addForm, setAddForm, 'Thêm')}
                <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
                  {saving ? 'Đang lưu…' : 'Thêm nguyên liệu'}
                </button>
              </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-surface-200 bg-white">
              <div className="flex items-center justify-between border-b border-surface-200 p-5">
                <h2 className="font-bold text-surface-900">Danh sách nguyên liệu</h2>
                <span className="text-sm text-surface-500">{loadingIngredients ? 'Đang tải…' : `${ingredients.length} nguyên liệu`}</span>
              </div>
              {loadingIngredients ? (
                <p className="p-8 text-center text-sm text-surface-500">Đang tải nguyên liệu…</p>
              ) : ingredients.length === 0 ? (
                <p className="p-8 text-center text-sm text-surface-500">Công thức này chưa có nguyên liệu.</p>
              ) : (
                <ul className="divide-y divide-surface-200">
                  {ingredients.map((ingredient) => (
                    <li key={ingredient.id} className="p-5">
                      {editingId === ingredient.id ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleUpdate(ingredient)
                          }}
                          className="space-y-4"
                        >
                          {ingredientForm(editForm, setEditForm, `Sửa ${ingredient.name}`)}
                          <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Lưu</button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-surface-300 px-4 py-2 text-sm">Hủy</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-surface-900">{ingredient.name}</h3>
                            <p className="mt-1 text-sm text-surface-600">
                              {[ingredient.quantity, ingredient.unit].filter((value) => value !== undefined && value !== '').join(' ')}
                            </p>
                            {ingredient.notes && <p className="mt-1 text-sm text-surface-500">{ingredient.notes}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setEditForm(toInput(ingredient)); setEditingId(ingredient.id); setError(''); setNotice('') }} className="rounded-lg border border-surface-300 px-3 py-2 text-sm">Sửa</button>
                            <button type="button" onClick={() => setDeleteId(ingredient.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Xóa</button>
                          </div>
                        </div>
                      )}
                      {deleteId === ingredient.id && (
                        <div className="mt-3 rounded-lg bg-red-50 p-3" role="group" aria-label={`Xác nhận xóa ${ingredient.name}`}>
                          <p className="text-sm text-red-800">Xóa nguyên liệu “{ingredient.name}”?</p>
                          <div className="mt-2 flex gap-2">
                            <button type="button" disabled={saving} onClick={() => void handleDelete()} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-60">Xác nhận xóa</button>
                            <button type="button" onClick={() => setDeleteId(null)} className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm">Hủy</button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation">
          <Link to="/dashboard" className="flex-1 text-center text-xs text-surface-500">Tổng quan</Link>
          <Link to="/dashboard/ingredients" className="flex-1 text-center text-xs font-medium text-brand-600">Nguyên liệu</Link>
          <Link to="/profile" className="flex-1 text-center text-xs text-surface-500">Cá nhân</Link>
        </nav>
      </main>
    </div>
  )
}
