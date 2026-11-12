import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import {
  addRecipeStep,
  ApiError,
  deleteRecipeStep,
  getManagedRecipes,
  getRecipeSteps,
  updateRecipeStep,
} from '../lib/api'
import { useAuthStore } from '../store'
import type { CreateStepPayload, Recipe, RecipePage, RecipeStep } from '../types/recipe'

type StepForm = {
  stepNumber: string
  title: string
  description: string
  timerMinutes: string
  imageUrl: string
}

const emptyForm: StepForm = {
  stepNumber: '',
  title: '',
  description: '',
  timerMinutes: '',
  imageUrl: '',
}
const inputClass =
  'mt-1 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
const buttonClass =
  'rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50'

function stepFormFor(step: RecipeStep): StepForm {
  return {
    stepNumber: String(step.stepNumber),
    title: step.title,
    description: step.description,
    timerMinutes: step.timerMinutes === undefined ? '' : String(step.timerMinutes),
    imageUrl: step.imageUrl ?? '',
  }
}

function errorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError)) {
    return reason instanceof Error ? reason.message : 'Không thể thực hiện yêu cầu.'
  }
  if (reason.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (reason.status === 403) return 'Bạn không có quyền quản lý các bước của công thức này.'
  if (reason.status === 404) return 'Công thức hoặc bước nấu không còn tồn tại. Hãy tải lại.'
  if (reason.status === 409) return 'Các bước vừa được thay đổi. Hãy tải lại rồi thử lại.'
  if (reason.status === 422) {
    return (
      Object.values(reason.problem?.errors ?? {})
        .flat()
        .join(' ') || 'Vui lòng kiểm tra thông tin bước nấu.'
    )
  }
  if (reason.status === 0) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  return 'Máy chủ gặp lỗi. Vui lòng thử lại sau.'
}

function validateForm(form: StepForm): CreateStepPayload {
  const title = form.title.trim()
  const description = form.description.trim()
  if (!title) throw new Error('Vui lòng nhập tiêu đề bước nấu.')
  if (!description) throw new Error('Vui lòng nhập hướng dẫn thực hiện.')
  if (title.length > 200) throw new Error('Tiêu đề bước nấu không được quá 200 ký tự.')

  const timer = form.timerMinutes.trim() ? Number(form.timerMinutes) : undefined
  if (timer !== undefined && (!Number.isInteger(timer) || timer < 0)) {
    throw new Error('Thời gian cần là số phút nguyên không âm.')
  }

  const imageUrl = form.imageUrl.trim()
  if (imageUrl) {
    try {
      new URL(imageUrl)
    } catch {
      throw new Error('Đường dẫn hình ảnh không hợp lệ.')
    }
  }

  return { title, description, timerMinutes: timer, imageUrl: imageUrl || undefined }
}

export default function RecipeStepsPage() {
  const session = useAuthStore((state) => state.session)
  if (!session) return null
  const accountKey = JSON.stringify([session.user.id, [...session.user.roles].sort()])
  return <AccountRecipeStepsPage key={accountKey} />
}

function AccountRecipeStepsPage() {
  const navigate = useNavigate()
  const locationSession = useAuthStore((state) => state.session)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const requestedPageSize = Number(searchParams.get('pageSize') ?? 12)
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0 && requestedPageSize <= 50
      ? requestedPageSize
      : 12
  const recipeId = searchParams.get('recipeId') ?? ''
  const accountKey = locationSession
    ? `${locationSession.user.id}:${[...locationSession.user.roles].sort().join(',')}`
    : ''
  const [recipes, setRecipes] = useState<RecipePage | null>(null)
  const [steps, setSteps] = useState<RecipeStep[]>([])
  const [loadedStepsKey, setLoadedStepsKey] = useState('')
  const [finishedStepsKey, setFinishedStepsKey] = useState('')
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const [addForm, setAddForm] = useState<StepForm>(emptyForm)
  const [editing, setEditing] = useState<RecipeStep | null>(null)
  const [editForm, setEditForm] = useState<StepForm>(emptyForm)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const selectedRecipe = recipes?.items.find((recipe) => recipe.id === recipeId)
  const missingRecipe =
    !loadingRecipes && Boolean(recipeId) && Boolean(recipes) && !selectedRecipe
  const stepsKey = JSON.stringify([accountKey, recipeId, revision])
  const loadingSteps = Boolean(selectedRecipe) && finishedStepsKey !== stepsKey
  const ready = Boolean(selectedRecipe) && loadedStepsKey === stepsKey && !loadingSteps
  const selectionVersion = useRef(0)
  const busy = useRef(false)
  const mounted = useRef(true)

  useLayoutEffect(() => {
    selectionVersion.current += 1
  }, [accountKey, recipeId])

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
        if (page > Math.max(1, result.meta.totalPages)) {
          setSearchParams((current) => {
            const next = new URLSearchParams(current)
            next.set('page', String(Math.max(1, result.meta.totalPages)))
            return next
          }, { replace: true })
          return
        }
        setRecipes(result)
        if (result.items[0]) {
          setSearchParams((current) => {
            if (current.get('recipeId')) return current
            const next = new URLSearchParams(current)
            next.set('page', String(page))
            next.set('pageSize', String(pageSize))
            next.set('recipeId', result.items[0]!.id)
            return next
          }, { replace: true })
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401) {
          const current = useAuthStore.getState().session
          if (!current || current.user.id === account?.user.id) {
            useAuthStore.getState().signOut()
            navigate('/auth/login', { replace: true })
          }
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
    getRecipeSteps(token, recipeId, controller.signal)
      .then((result) => {
        if (!active) return
        setSteps(result)
        setLoadedStepsKey(stepsKey)
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401) {
          const current = useAuthStore.getState().session
          if (!current || current.user.id === account?.user.id) {
            useAuthStore.getState().signOut()
            navigate('/auth/login', { replace: true })
          }
          return
        }
        if (active) setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setFinishedStepsKey(stepsKey)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [accountKey, navigate, recipeId, selectedRecipe, stepsKey])

  function chooseRecipe(nextRecipeId: string) {
    const next = new URLSearchParams(searchParams)
    if (nextRecipeId) next.set('recipeId', nextRecipeId)
    else next.delete('recipeId')
    next.set('page', String(page))
    next.set('pageSize', String(pageSize))
    setEditing(null)
    setDeleting(null)
    setError('')
    setNotice('')
    setSearchParams(next)
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    next.delete('recipeId')
    setEditing(null)
    setDeleting(null)
    setError('')
    setNotice('')
    setLoadingRecipes(true)
    setSearchParams(next)
  }

  async function mutate(action: (isCurrent: () => boolean) => Promise<void>) {
    if (busy.current || !ready || !selectedRecipe) return
    const recipeAtStart = recipeId
    const selectionAtStart = selectionVersion.current
    const isCurrent = () =>
      mounted.current &&
      selectionVersion.current === selectionAtStart &&
      recipeId === recipeAtStart
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
      } else {
        setError(errorMessage(reason))
      }
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }

  async function refreshSteps(): Promise<RecipeStep[]> {
    const token = useAuthStore.getState().session?.accessToken ?? ''
    return getRecipeSteps(token, recipeId)
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(async (isCurrent) => {
      const payload = validateForm(addForm)
      await addRecipeStep(
        useAuthStore.getState().session?.accessToken ?? '',
        recipeId,
        payload,
      )
      const result = await refreshSteps()
      if (!isCurrent()) return
      setSteps(result)
      setLoadedStepsKey(stepsKey)
      setFinishedStepsKey(stepsKey)
      setAddForm(emptyForm)
      setNotice('Đã thêm bước nấu.')
    })
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    await mutate(async (isCurrent) => {
      const payload = validateForm(editForm)
      const stepNumber = Number(editForm.stepNumber)
      if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > steps.length) {
        throw new Error(`Thứ tự bước phải từ 1 đến ${steps.length}.`)
      }
      await updateRecipeStep(
        useAuthStore.getState().session?.accessToken ?? '',
        recipeId,
        editing.id,
        {
          ...payload,
          stepNumber,
          timerMinutes: payload.timerMinutes ?? null,
          imageUrl: payload.imageUrl ?? null,
        },
      )
      const result = await refreshSteps()
      if (!isCurrent()) return
      setSteps(result)
      setLoadedStepsKey(stepsKey)
      setFinishedStepsKey(stepsKey)
      setEditing(null)
      setNotice('Đã cập nhật bước nấu.')
    })
  }

  async function remove() {
    if (!deleting) return
    await mutate(async (isCurrent) => {
      await deleteRecipeStep(
        useAuthStore.getState().session?.accessToken ?? '',
        recipeId,
        deleting,
      )
      const result = await refreshSteps()
      if (!isCurrent()) return
      setSteps(result)
      setLoadedStepsKey(stepsKey)
      setFinishedStepsKey(stepsKey)
      setDeleting(null)
      setEditing(null)
      setNotice('Đã xóa bước nấu và cập nhật lại thứ tự.')
    })
  }

  function fields(form: StepForm, setForm: (next: StepForm) => void, editingStep: boolean) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {editingStep && (
          <label className="text-sm font-medium">
            Thứ tự bước *
            <input
              aria-label="Thứ tự bước"
              type="number"
              min="1"
              max={steps.length}
              step="1"
              required
              value={form.stepNumber}
              onChange={(event) => setForm({ ...form, stepNumber: event.target.value })}
              className={inputClass}
            />
          </label>
        )}
        <label className="text-sm font-medium">
          Tiêu đề bước *
          <input
            aria-label={`${editingStep ? 'Sửa' : 'Thêm'} - Tiêu đề bước`}
            required
            maxLength={200}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Thời gian (phút)
          <input
            aria-label={`${editingStep ? 'Sửa' : 'Thêm'} - Thời gian`}
            type="number"
            min="0"
            step="1"
            value={form.timerMinutes}
            onChange={(event) => setForm({ ...form, timerMinutes: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Hướng dẫn thực hiện *
          <textarea
            aria-label={`${editingStep ? 'Sửa' : 'Thêm'} - Hướng dẫn`}
            required
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          URL hình minh họa
          <input
            aria-label={`${editingStep ? 'Sửa' : 'Thêm'} - URL hình minh họa`}
            type="url"
            maxLength={500}
            value={form.imageUrl}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
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
          <h1 className="text-2xl font-bold">Quản lý các bước nấu</h1>
          <p className="mt-2 text-sm text-surface-500">
            Thêm, chỉnh sửa, sắp xếp và xóa từng bước trong công thức.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRevision((value) => value + 1)}
          disabled={pending || loadingRecipes || loadingSteps}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Tải lại
        </button>
      </header>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">{notice}</p>}
      {missingRecipe && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-800">
          Công thức đã chọn không nằm trong trang hiện tại hoặc bạn không còn quyền truy cập.
          Hãy chọn lại công thức hoặc chuyển trang.
        </p>
      )}
      <section className="mb-6 rounded-xl border border-surface-200 bg-white p-5">
        <label htmlFor="steps-recipe" className="font-semibold">Chọn công thức</label>
        <select
          id="steps-recipe"
          size={6}
          aria-describedby="steps-recipe-help"
          className={`${inputClass} h-52 overflow-y-scroll`}
          value={recipeId}
          disabled={pending || loadingRecipes}
          onChange={(event) => chooseRecipe(event.target.value)}
        >
          <option value="">{loadingRecipes ? 'Đang tải công thức…' : 'Chọn một công thức'}</option>
          {recipeId && !selectedRecipe && !loadingRecipes && (
            <option value={recipeId} disabled>Công thức đã chọn không có trong trang hiện tại</option>
          )}
          {recipes?.items.map((recipe: Recipe) => (
            <option key={recipe.id} value={recipe.id}>{recipe.title} — {recipe.status}</option>
          ))}
        </select>
        <p id="steps-recipe-help" className="mt-2 text-sm text-surface-500">
          Cuộn danh sách để chọn công thức. Dùng phân trang bên dưới để xem các công thức còn lại.
        </p>
        {recipes && (
          <Pagination
            page={recipes.meta.page}
            totalPages={recipes.meta.totalPages}
            totalCount={recipes.meta.totalCount}
            itemLabel="công thức"
            disabled={pending || loadingRecipes}
            onPageChange={changePage}
            label="Phân trang chọn công thức"
          />
        )}
        {!loadingRecipes && recipes?.items.length === 0 && (
          <EmptyState title="Chưa có công thức" description="Bạn cần có công thức để quản lý các bước nấu." />
        )}
      </section>
      {selectedRecipe && (
        <>
          <section className="mb-6 rounded-xl border border-surface-200 bg-white p-5">
            <h2 className="mb-1 text-lg font-bold">Thêm bước nấu</h2>
            <p className="mb-4 text-sm text-surface-500">
              Bước mới sẽ tự động được thêm ở vị trí cuối cùng của “{selectedRecipe.title}”.
            </p>
            <form onSubmit={(event) => void add(event)}>
              <fieldset disabled={pending || !ready} className="space-y-4 disabled:opacity-60">
                {fields(addForm, setAddForm, false)}
                <button type="submit" className={buttonClass}>
                  {pending ? 'Đang lưu…' : 'Thêm bước nấu'}
                </button>
              </fieldset>
            </form>
          </section>
          <section className="overflow-hidden rounded-xl border border-surface-200 bg-white">
            <div className="border-b border-surface-200 p-5">
              <h2 className="text-lg font-bold">Danh sách bước nấu</h2>
              <p className="mt-1 text-sm text-surface-500">
                {selectedRecipe.title} · {steps.length} bước
              </p>
            </div>
            {!ready ? (
              <PageLoading label="Đang tải các bước nấu…" cards={2} />
            ) : steps.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Chưa có bước nấu" description="Thêm bước đầu tiên cho công thức này." />
              </div>
            ) : (
              <ol className="divide-y divide-surface-200">
                {steps.map((step) => (
                  <li key={step.id} className="p-5" aria-label={`Bước ${step.stepNumber}: ${step.title}`}>
                    {editing?.id === step.id ? (
                      <form onSubmit={(event) => void update(event)}>
                        <fieldset disabled={pending} className="space-y-4">
                          {fields(editForm, setEditForm, true)}
                          <div className="flex gap-3">
                            <button type="submit" className={buttonClass}>Lưu thay đổi</button>
                            <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 text-sm">
                              Hủy sửa
                            </button>
                          </div>
                        </fieldset>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold">Bước {step.stepNumber}: {step.title}</h3>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-surface-600">{step.description}</p>
                            {step.timerMinutes !== undefined && (
                              <p className="mt-2 text-xs text-surface-500">{step.timerMinutes} phút</p>
                            )}
                            {step.imageUrl && (
                              <a className="mt-2 inline-block text-sm text-brand-700 underline" href={step.imageUrl} target="_blank" rel="noreferrer">
                                Xem hình minh họa
                              </a>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              disabled={pending || !ready}
                              aria-label={`Sửa bước ${step.stepNumber}`}
                              onClick={() => {
                                setEditing(step)
                                setEditForm(stepFormFor(step))
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
                              aria-label={`Xóa bước ${step.stepNumber}`}
                              onClick={() => setDeleting(step.id)}
                              className="text-sm text-red-700 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                        {deleting === step.id && (
                          <div role="group" aria-label={`Xác nhận xóa bước ${step.stepNumber}`} className="mt-4 rounded-lg bg-red-50 p-4">
                            <p className="text-sm text-red-800">Xóa bước “{step.title}”?</p>
                            <div className="mt-3 flex gap-3">
                              <button type="button" disabled={pending} onClick={() => void remove()} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">
                                Xác nhận xóa
                              </button>
                              <button type="button" disabled={pending} onClick={() => setDeleting(null)} className="px-3 py-2 text-sm">
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
      <p className="mt-6 text-sm text-surface-500">
        <Link to="/dashboard/recipes" className="text-brand-700">← Về danh sách công thức</Link>
      </p>
    </>
  )
}
