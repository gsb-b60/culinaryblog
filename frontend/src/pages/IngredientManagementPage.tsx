import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import {
  ApiError,
  addRecipeIngredient,
  deleteRecipeIngredient,
  getManagedRecipes,
  getRecipeIngredients,
  updateRecipeIngredient,
} from '../lib/api'
import { useAuthStore } from '../store'
import type { CreateIngredientPayload, RecipeIngredient, RecipePage } from '../types/recipe'

type IngredientForm = {
  name: string
  quantity: string
  unit: string
  notes: string
}
const emptyForm: IngredientForm = {
  name: '',
  quantity: '',
  unit: '',
  notes: '',
}
const inputClass =
  'mt-1 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
const buttonClass =
  'rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50'
/** Copy persisted ingredient values into editable form fields without mutating the DTO. */
function formFor(item: RecipeIngredient): IngredientForm {
  return {
    name: item.name,
    quantity: item.quantity?.toString() ?? '',
    unit: item.unit ?? '',
    notes: item.notes ?? '',
  }
}
/** Translate API and validation failures into a message suitable for the user. */
function errorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError))
    return reason instanceof Error ? reason.message : 'Không thể thực hiện yêu cầu.'
  if (reason.status === 403) return 'Bạn không có quyền quản lý nguyên liệu của công thức này.'
  if (reason.status === 404)
    return 'Công thức hoặc nguyên liệu không còn tồn tại. Hãy tải lại danh sách.'
  if (reason.status === 422)
    return (
      Object.values(reason.problem?.errors ?? {})
        .flat()
        .join(' ') || 'Vui lòng kiểm tra dữ liệu nguyên liệu.'
    )
  return reason.message
}
/** Validate and normalize ingredient fields before sending a mutation. */
function payloadFor(form: IngredientForm, orderIndex: number): CreateIngredientPayload {
  const name = form.name.trim()
  if (!name) throw new Error('Vui lòng nhập tên nguyên liệu.')
  const quantity = form.quantity.trim() ? Number(form.quantity) : undefined
  if (
    quantity !== undefined &&
    (!Number.isFinite(quantity) || quantity <= 0 || quantity > 999999.999)
  ) {
    throw new Error('Số lượng phải lớn hơn 0 và không vượt quá 999999.999.')
  }
  return {
    name,
    quantity,
    unit: form.unit.trim(),
    notes: form.notes.trim(),
    orderIndex,
  }
}

/** DashboardLayout owns authentication, navigation and logout. */
export default function IngredientManagementPage() {
  const session = useAuthStore((state) => state.session)
  if (!session) return null
  const accountKey = JSON.stringify([session.user.id, [...session.user.roles].sort()])
  return <AccountIngredientManagementPage key={accountKey} />
}

function AccountIngredientManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const session = useAuthStore((state) => state.session)
  const accountKey = session ? `${session.user.id}:${session.user.roles.join(',')}` : ''
  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const requestedPageSize = Number(searchParams.get('pageSize') ?? 12)
  const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0 && requestedPageSize <= 50
    ? requestedPageSize
    : 12
  const recipeId = searchParams.get('recipeId') ?? ''
  const [recipes, setRecipes] = useState<RecipePage | null>(null)
  const [savedIngredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [loadedIngredientKey, setLoadedIngredientKey] = useState('')
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [finishedIngredientKey, setFinishedIngredientKey] = useState('')
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const [addForm, setAddForm] = useState<IngredientForm>(emptyForm)
  const [editing, setEditing] = useState<RecipeIngredient | null>(null)
  const [editForm, setEditForm] = useState<IngredientForm>(emptyForm)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const selectedRecipe =
    recipes?.meta.page === page && recipes.meta.pageSize === pageSize
      ? recipes.items.find((item) => item.id === recipeId)
      : undefined
  const missingRecipe = !loadingRecipes && !error && recipes?.meta.page === page && Boolean(recipeId) && !selectedRecipe
  const ingredientKey = JSON.stringify([accountKey, recipeId, location.key, revision])
  const loadingIngredients = Boolean(selectedRecipe) && finishedIngredientKey !== ingredientKey
  const ingredients = loadedIngredientKey === ingredientKey ? savedIngredients : []
  const selectionVersion = useRef(0)
  useLayoutEffect(() => {
    selectionVersion.current += 1
  }, [accountKey, recipeId, location.key])
  const busy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const account = useAuthStore.getState().session
    const token = account?.accessToken
    if (!accountKey || !token) return
    let active = true
    const controller = new AbortController()
    getManagedRecipes(token, page, controller.signal, pageSize)
      .then((result) => {
        if (!active) return
        setRecipes(result)
        setSearchParams(
          (current) => {
            const preferred = current.get('recipeId') ?? ''
            // Never replace an explicitly requested recipe with a different one.
            const nextId = preferred || (result.items[0]?.id ?? '')
            const next = new URLSearchParams(current)
            next.set('page', String(page))
            next.set('pageSize', String(pageSize))
            if (nextId) next.set('recipeId', nextId)
            else next.delete('recipeId')
            return next
          },
          { replace: true },
        )
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401 && (!useAuthStore.getState().session || useAuthStore.getState().session?.user.id === account?.user.id)) {
          useAuthStore.getState().signOut()
          navigate('/auth/login', { replace: true })
          return
        }
        if (active) setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setLoadingRecipes(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [accountKey, page, pageSize, revision, navigate, setSearchParams])

  useEffect(() => {
    const account = useAuthStore.getState().session
    const token = account?.accessToken
    if (!accountKey || !selectedRecipe || !token) return
    let active = true
    const controller = new AbortController()
    getRecipeIngredients(token, recipeId, controller.signal)
      .then((result) => {
        if (active) {
          setIngredients(result)
          setLoadedIngredientKey(ingredientKey)
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401 && (!useAuthStore.getState().session || useAuthStore.getState().session?.user.id === account?.user.id)) {
          useAuthStore.getState().signOut()
          navigate('/auth/login', { replace: true })
          return
        }
        if (active) setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setFinishedIngredientKey(ingredientKey)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [accountKey, recipeId, selectedRecipe, ingredientKey, navigate])

  if (!session) return null
  const ready =
    Boolean(selectedRecipe) &&
    loadedIngredientKey === ingredientKey &&
    !loadingRecipes &&
    !loadingIngredients
  /** Clear recipe-specific forms, messages and loading state when selection changes. */
  function resetSelection() {
    setFinishedIngredientKey('')
    setIngredients([])
    setLoadedIngredientKey('')
    setEditing(null)
    setDeleting(null)
    setAddForm(emptyForm)
    setEditForm(emptyForm)
    setError('')
    setNotice('')
  }
  /** Retry the current page and ingredients after clearing stale form state. */
  function reload() {
    resetSelection()
    setLoadingRecipes(true)
    setRevision((value) => value + 1)
  }
  /** Serialize ingredient changes and restore controls after completion or failure. */
  async function mutate(action: (isCurrent: () => boolean) => Promise<void>) {
    if (busy.current || !ready) return
    const version = selectionVersion.current
    const isCurrent = () => mounted.current && selectionVersion.current === version
    busy.current = true
    setPending(true)
    setError('')
    setNotice('')
    try {
      await action(isCurrent)
    } catch (reason) {
      if (!isCurrent() && !(reason instanceof ApiError && reason.status === 401 && !useAuthStore.getState().session)) return
      if (reason instanceof ApiError && reason.status === 401) {
        useAuthStore.getState().signOut()
        navigate('/auth/login', { replace: true })
      } else setError(errorMessage(reason))
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }
  /** Read current credentials so mutations use any token rotated by the API client. */
  function currentToken() {
    return useAuthStore.getState().session?.accessToken ?? ''
  }
  /** Append a validated ingredient and display the persisted API result. */
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(async (isCurrent) => {
      const nextOrder = ingredients.reduce((max, item) => Math.max(max, item.orderIndex), -1) + 1
      const result = await addRecipeIngredient(
        currentToken(),
        recipeId,
        payloadFor(addForm, nextOrder),
      )
      if (!isCurrent()) return
      setIngredients((items) => [...items, result])
      setAddForm(emptyForm)
      setNotice('Đã thêm nguyên liệu.')
    })
  }
  /** Save edited fields and replace the matching ingredient in the list. */
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    await mutate(async (isCurrent) => {
      const result = await updateRecipeIngredient(
        currentToken(),
        recipeId,
        editing.id,
        payloadFor(editForm, editing.orderIndex),
      )
      if (!isCurrent()) return
      setIngredients((items) => items.map((item) => (item.id === result.id ? result : item)))
      setEditing(null)
      setNotice('Đã cập nhật nguyên liệu.')
    })
  }
  /** Delete the confirmed ingredient through the API and remove it from the display. */
  async function remove() {
    if (!deleting) return
    await mutate(async (isCurrent) => {
      await deleteRecipeIngredient(currentToken(), recipeId, deleting)
      if (!isCurrent()) return
      setIngredients((items) => items.filter((item) => item.id !== deleting))
      if (editing?.id === deleting) setEditing(null)
      setDeleting(null)
      setNotice('Đã xóa nguyên liệu.')
    })
  }
  /** Render labelled ingredient inputs shared by creation and editing forms. */
  function fields(form: IngredientForm, setForm: (value: IngredientForm) => void, label: string) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Tên nguyên liệu *
          <input
            aria-label={`${label} - Tên nguyên liệu`}
            required
            maxLength={200}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Số lượng
          <input
            aria-label={`${label} - Số lượng`}
            type="number"
            min="0.001"
            max="999999.999"
            step="0.001"
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Đơn vị
          <input
            aria-label={`${label} - Đơn vị`}
            maxLength={50}
            value={form.unit}
            onChange={(event) => setForm({ ...form, unit: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Ghi chú
          <input
            aria-label={`${label} - Ghi chú`}
            maxLength={500}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className={inputClass}
          />
        </label>
      </div>
    )
  }
  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý nguyên liệu</h1>
          <p className="mt-2 text-sm text-surface-500">
            Chọn công thức để xem, thêm, sửa và xóa nguyên liệu.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={pending || loadingRecipes || loadingIngredients}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Tải lại
        </button>
      </header>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {missingRecipe && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-800">
          Công thức đã chọn không có trong trang hiện tại hoặc bạn không còn quyền truy cập.
          Hãy chọn lại công thức hoặc chuyển trang; hệ thống giữ nguyên lựa chọn để tránh sửa nhầm.
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
          {notice}
        </p>
      )}
      <section className="mb-6 rounded-xl border border-surface-200 bg-white p-5">
        <label htmlFor="ingredient-recipe" className="font-semibold">
          Chọn công thức
        </label>
        <select
          id="ingredient-recipe"
          size={6}
          aria-describedby="ingredient-recipe-help"
          className={`${inputClass} h-52 overflow-y-scroll`}
          value={recipeId}
          disabled={pending || loadingRecipes}
          onChange={(event) => {
            if (event.target.value === recipeId) return
            resetSelection()
            const next = new URLSearchParams(searchParams)
            next.set('page', String(page))
            if (event.target.value) next.set('recipeId', event.target.value)
            else next.delete('recipeId')
            setSearchParams(next, { replace: true })
          }}
        >
          <option value="">{loadingRecipes ? 'Đang tải công thức…' : 'Chọn một công thức'}</option>
          {recipeId && !selectedRecipe && !loadingRecipes && (
            <option value={recipeId} disabled>Công thức đã chọn không có trong trang hiện tại</option>
          )}
          {recipes?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} —{' '}
              {item.status === 'DRAFT'
                ? 'Bản nháp'
                : item.status === 'PUBLISHED'
                  ? 'Đã xuất bản'
                  : 'Đã lưu trữ'}
            </option>
          ))}
        </select>
        <p id="ingredient-recipe-help" className="mt-2 text-sm text-surface-500">
          Cuộn danh sách để chọn công thức. Dùng phân trang bên dưới để xem các công thức còn lại.
        </p>
        {recipes && (
          <Pagination
            page={recipes.meta.page}
            totalPages={recipes.meta.totalPages}
            totalCount={recipes.meta.totalCount}
            itemLabel="công thức"
            disabled={pending || loadingRecipes}
            label="Phân trang chọn công thức"
            onPageChange={(value) => {
              resetSelection()
              const next = new URLSearchParams(searchParams)
              next.delete('recipeId')
              next.set('page', String(value))
              setSearchParams(next)
              setLoadingRecipes(true)
            }}
          />
        )}
        {!loadingRecipes && recipes?.items.length === 0 && (
          <EmptyState
            title="Chưa có công thức"
            description="Bạn cần có công thức để quản lý nguyên liệu."
          />
        )}
      </section>
      {recipeId && (
        <>
          <section className="mb-6 rounded-xl border border-surface-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold">Thêm nguyên liệu</h2>
            <form onSubmit={(event) => void add(event)}>
              <fieldset disabled={pending || !ready} className="space-y-4 disabled:opacity-60">
                {fields(addForm, setAddForm, 'Thêm')}
                <button type="submit" className={buttonClass}>
                  {pending ? 'Đang lưu…' : 'Thêm nguyên liệu'}
                </button>
              </fieldset>
            </form>
          </section>
          <section className="overflow-hidden rounded-xl border border-surface-200 bg-white">
            <div className="border-b border-surface-200 p-5">
              <h2 className="text-lg font-bold">Danh sách nguyên liệu</h2>
              <p className="mt-1 text-sm text-surface-500">
                {selectedRecipe?.title} · {ingredients.length} nguyên liệu
              </p>
            </div>
            {!ready && !error ? (
              <PageLoading label="Đang tải nguyên liệu…" cards={2} />
            ) : ingredients.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Chưa có nguyên liệu"
                  description="Thêm nguyên liệu đầu tiên cho công thức này."
                />
              </div>
            ) : (
              <ul className="divide-y divide-surface-200">
                {ingredients.map((item) => (
                  <li key={item.id} className="p-5" aria-label={item.name}>
                    {editing?.id === item.id ? (
                      <form onSubmit={(event) => void update(event)}>
                        <fieldset disabled={pending} className="space-y-4">
                          {fields(editForm, setEditForm, 'Sửa')}
                          <p className="text-xs text-surface-500">
                            Để trống số lượng sẽ giữ lại giá trị hiện có.
                          </p>
                          <div className="flex gap-3">
                            <button type="submit" className={buttonClass}>
                              Lưu thay đổi
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="px-3 py-2 text-sm"
                            >
                              Hủy sửa
                            </button>
                          </div>
                        </fieldset>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="mt-1 text-sm text-surface-600">
                            {[item.quantity, item.unit]
                              .filter((value) => value !== undefined && value !== '')
                              .join(' ')}
                          </p>
                          {item.notes && (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-surface-500">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            disabled={pending || !ready}
                            aria-label={`Sửa ${item.name}`}
                            onClick={() => {
                              setEditing(item)
                              setEditForm(formFor(item))
                              setDeleting(null)
                              setError('')
                              setNotice('')
                            }}
                            className="text-sm font-semibold text-brand-700 disabled:opacity-50"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={pending || !ready}
                            aria-label={`Xóa ${item.name}`}
                            onClick={() => {
                              setDeleting(item.id)
                              setError('')
                            }}
                            className="text-sm text-red-700 disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    )}
                    {deleting === item.id && (
                      <div
                        role="group"
                        aria-label={`Xác nhận xóa ${item.name}`}
                        className="mt-4 rounded-lg bg-red-50 p-4"
                      >
                        <p className="text-sm text-red-800">Xóa nguyên liệu “{item.name}”?</p>
                        <div className="mt-3 flex gap-3">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => void remove()}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                          >
                            Xác nhận xóa
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setDeleting(null)}
                            className="px-3 py-2 text-sm"
                          >
                            Hủy
                          </button>
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
      <p className="mt-6 text-sm text-surface-500">
        <Link to="/dashboard/recipes" className="text-brand-700">
          ← Về danh sách công thức
        </Link>
      </p>
    </>
  )
}
