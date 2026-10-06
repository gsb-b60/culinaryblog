import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import {
  ApiError,
  addRecipeStep,
  deleteRecipeStep,
  getManagedRecipes,
  getRecipeSteps,
  publishRecipe,
  unpublishRecipe,
  updateRecipeStep,
} from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'
import type { ManagedRecipe, RecipeStep, StepPayload } from '../types/recipe'

const inputClass =
  'mt-1 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500'
const buttonClass =
  'rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-50'

export default function RecipeStepsPage() {
  const navigate = useNavigate()
  const session = loadSession()
  const accessToken = session?.accessToken
  const [recipes, setRecipes] = useState<ManagedRecipe[]>([])
  const [recipeId, setRecipeId] = useState('')
  const [steps, setSteps] = useState<RecipeStep[]>([])
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [stepsReady, setStepsReady] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState<RecipeStep | null>(null)
  const [deleting, setDeleting] = useState<RecipeStep | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timer, setTimer] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (!accessToken) return
    let active = true
    getManagedRecipes(accessToken)
      .then((items) => {
        if (!active) return
        setRecipes(items)
        setRecipeId((current) =>
          items.some((item) => item.id === current) ? current : (items[0]?.id ?? ''),
        )
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Không thể tải công thức.')
        if (reason instanceof ApiError && reason.status === 401) {
          clearSession()
          navigate('/auth/login', { replace: true })
        }
      })
      .finally(() => {
        if (active) setLoadingRecipes(false)
      })
    return () => {
      active = false
    }
  }, [accessToken, navigate, reload])

  useEffect(() => {
    if (!accessToken || !recipeId) return
    let active = true
    getRecipeSteps(accessToken, recipeId)
      .then((result) => {
        if (active) {
          setSteps(result.steps)
          setStepsReady(true)
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải bước nấu.')
      })
      .finally(() => {
        if (active) setLoadingSteps(false)
      })
    return () => {
      active = false
    }
  }, [accessToken, recipeId, reload])

  if (!session) return <Navigate to="/auth/login" replace />

  function resetForm() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setTimer('')
    setImageUrl('')
    setFieldErrors({})
  }
  function reportError(reason: unknown) {
    if (reason instanceof ApiError) {
      const messages: Record<number, string> = {
        403: 'Bạn không có quyền quản lý công thức này.',
        404: 'Công thức hoặc bước nấu không còn tồn tại. Hãy tải lại danh sách.',
      }
      const stepError = reason.status === 422 ? reason.problem?.errors?.steps?.[0] : undefined
      setError(messages[reason.status] ?? stepError ?? reason.message)
      setFieldErrors(reason.problem?.errors ?? {})
      if (reason.status === 401) {
        clearSession()
        navigate('/auth/login', { replace: true })
      }
    } else
      setError(reason instanceof Error ? reason.message : 'Thao tác thất bại. Vui lòng thử lại.')
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: Record<string, string[]> = {}
    if (!title.trim()) errors.title = ['Vui lòng nhập tiêu đề.']
    if (!description.trim()) errors.description = ['Vui lòng nhập mô tả.']
    const minutes = timer === '' ? undefined : Number(timer)
    if (
      minutes !== undefined &&
      (!Number.isInteger(minutes) || minutes < 0 || minutes > 2147483647)
    )
      errors.timerMinutes = ['Thời gian phải là số nguyên không âm.']
    setFieldErrors(errors)
    setError('')
    setSuccess('')
    if (Object.keys(errors).length || !accessToken) return
    const payload: StepPayload = {
      title: title.trim(),
      description: description.trim(),
      timerMinutes: minutes,
      imageUrl: imageUrl.trim() || undefined,
    }
    setBusy(true)
    try {
      const result = editing
        ? await updateRecipeStep(accessToken, recipeId, editing.id, payload)
        : await addRecipeStep(accessToken, recipeId, payload)
      setSteps((current) =>
        (editing
          ? current.map((item) => (item.id === result.id ? result : item))
          : [...current, result]
        ).sort((a, b) => a.stepNumber - b.stepNumber),
      )
      setSuccess(editing ? 'Đã cập nhật bước nấu.' : 'Đã thêm bước nấu.')
      resetForm()
    } catch (reason) {
      reportError(reason)
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    if (!deleting || !accessToken) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await deleteRecipeStep(accessToken, recipeId, deleting.id)
      // Discard the removed step immediately, then read the server's authoritative numbering.
      setSteps((current) =>
        current
          .filter((item) => item.id !== deleting.id)
          .map((item, index) => ({ ...item, stepNumber: index + 1 })),
      )
      if (editing?.id === deleting.id) resetForm()
      setDeleting(null)
      setSuccess('Đã xóa bước nấu và cập nhật số thứ tự.')
      const result = await getRecipeSteps(loadSession()?.accessToken ?? accessToken, recipeId)
      setSteps(result.steps)
    } catch (reason) {
      reportError(reason)
    } finally {
      setBusy(false)
    }
  }
  async function togglePublication() {
    if (!accessToken || !recipeId || !selectedRecipe) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const publish = selectedRecipe.status === 'DRAFT'
      if (publish) await publishRecipe(accessToken, recipeId)
      else await unpublishRecipe(accessToken, recipeId)
      setRecipes((current) =>
        current.map((recipe) =>
          recipe.id === recipeId ? { ...recipe, status: publish ? 'PUBLISHED' : 'DRAFT' } : recipe,
        ),
      )
      setSuccess(publish ? 'Đã xuất bản công thức.' : 'Đã chuyển công thức về bản nháp.')
    } catch (reason) {
      reportError(reason)
    } finally {
      setBusy(false)
    }
  }
  const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId)

  return (
    <main className="min-h-screen bg-surface-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/dashboard" className="text-sm font-medium text-brand-700">
          ← Về dashboard
        </Link>
        <header className="my-6">
          <p className="text-sm text-surface-500">Quản lý công thức</p>
          <h1 className="text-3xl font-bold text-surface-900">Bước nấu</h1>
          <p className="mt-2 text-surface-600">
            Thêm hướng dẫn từng bước để mọi người dễ dàng thực hiện món ăn.
          </p>
        </header>
        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}{' '}
            <button
              type="button"
              disabled={busy}
              className="underline"
              onClick={() => {
                setError('')
                resetForm()
                setStepsReady(false)
                setLoadingRecipes(true)
                setLoadingSteps(true)
                setReload((value) => value + 1)
              }}
            >
              Tải lại danh sách
            </button>
          </div>
        )}
        {success && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            {success}
          </p>
        )}
        <section className="mb-6 rounded-xl border border-surface-200 bg-white p-5">
          <label htmlFor="recipe" className="font-semibold">
            Chọn công thức
          </label>
          {loadingRecipes ? (
            <p role="status" className="mt-2">
              Đang tải công thức…
            </p>
          ) : recipes.length ? (
            <select
              id="recipe"
              value={recipeId}
              disabled={busy}
              className={inputClass}
              onChange={(event) => {
                setRecipeId(event.target.value)
                setSteps([])
                setStepsReady(false)
                setLoadingSteps(true)
                setError('')
                setSuccess('')
                setDeleting(null)
                resetForm()
              }}
            >
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title} ·{' '}
                  {recipe.status === 'PUBLISHED'
                    ? 'Đã xuất bản'
                    : recipe.status === 'ARCHIVED'
                      ? 'Đã lưu trữ'
                      : 'Bản nháp'}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-surface-500">Bạn chưa có công thức nào để quản lý bước nấu.</p>
          )}
          {selectedRecipe && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-surface-600">
                Trạng thái:{' '}
                <strong>
                  {selectedRecipe.status === 'PUBLISHED'
                    ? 'Đã xuất bản'
                    : selectedRecipe.status === 'ARCHIVED'
                      ? 'Đã lưu trữ'
                      : 'Bản nháp'}
                </strong>
              </p>
              {selectedRecipe.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  disabled={
                    busy ||
                    loadingSteps ||
                    (selectedRecipe.status === 'DRAFT' && steps.length === 0)
                  }
                  className={buttonClass}
                  onClick={() => void togglePublication()}
                >
                  {busy
                    ? 'Đang cập nhật…'
                    : selectedRecipe.status === 'PUBLISHED'
                      ? 'Chuyển về bản nháp'
                      : 'Xuất bản'}
                </button>
              )}
              {selectedRecipe.status === 'DRAFT' && steps.length === 0 && !loadingSteps && (
                <p className="w-full text-sm text-amber-700">
                  Thêm ít nhất một bước nấu trước khi xuất bản.
                </p>
              )}
            </div>
          )}
        </section>
        {recipeId && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section aria-label="Danh sách bước nấu" className="space-y-4">
              <h2 className="text-xl font-bold">Các bước thực hiện ({steps.length})</h2>
              {loadingSteps ? (
                <p role="status">Đang tải bước nấu…</p>
              ) : steps.length === 0 ? (
                <p className="rounded-xl border border-dashed border-surface-300 p-8 text-center text-surface-500">
                  Chưa có bước nấu. Hãy thêm bước đầu tiên.
                </p>
              ) : (
                steps.map((step) => (
                  <article
                    key={step.id}
                    className="rounded-xl border border-surface-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-bold text-brand-600">
                          Bước {step.stepNumber}
                        </span>
                        <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={busy || loadingSteps || !stepsReady}
                          className="text-sm font-semibold text-brand-700 disabled:opacity-50"
                          aria-label={`Sửa bước ${step.stepNumber}`}
                          onClick={() => {
                            setEditing(step)
                            setTitle(step.title)
                            setDescription(step.description)
                            setTimer(step.timerMinutes?.toString() ?? '')
                            setImageUrl(step.imageUrl ?? '')
                            setFieldErrors({})
                            setError('')
                            setSuccess('')
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={busy || loadingSteps || !stepsReady}
                          className="text-sm text-red-700 disabled:opacity-50"
                          aria-label={`Xóa bước ${step.stepNumber}`}
                          onClick={() => setDeleting(step)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-surface-700">{step.description}</p>
                    {step.timerMinutes !== undefined && (
                      <p className="mt-3 text-sm text-surface-500">
                        Thời gian: {step.timerMinutes} phút
                      </p>
                    )}
                    {step.imageUrl && (
                      <img
                        src={step.imageUrl}
                        alt={`Minh họa: ${step.title}`}
                        loading="lazy"
                        className="mt-4 max-h-64 w-full rounded-lg object-contain"
                      />
                    )}
                  </article>
                ))
              )}
            </section>
            <section className="h-fit rounded-xl border border-surface-200 bg-white p-5">
              <h2 className="mb-4 text-xl font-bold">
                {editing
                  ? `Sửa bước ${steps.find((item) => item.id === editing.id)?.stepNumber ?? editing.stepNumber}`
                  : 'Thêm bước mới'}
              </h2>
              <form onSubmit={save} className="space-y-4">
                <fieldset
                  disabled={busy || loadingRecipes || loadingSteps || !stepsReady}
                  className="space-y-4 disabled:opacity-60"
                >
                  <div>
                    <label htmlFor="step-title" className="text-sm font-semibold">
                      Tiêu đề *
                    </label>
                    <input
                      id="step-title"
                      required
                      maxLength={200}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                      aria-invalid={!!fieldErrors.title}
                    />
                    {fieldErrors.title && (
                      <p className="text-sm text-red-700">{fieldErrors.title.join(' ')}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="step-description" className="text-sm font-semibold">
                      Mô tả *
                    </label>
                    <textarea
                      id="step-description"
                      required
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={inputClass}
                      aria-invalid={!!fieldErrors.description}
                    />
                    {fieldErrors.description && (
                      <p className="text-sm text-red-700">{fieldErrors.description.join(' ')}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="step-timer" className="text-sm font-semibold">
                      Thời gian (phút)
                    </label>
                    <input
                      id="step-timer"
                      type="number"
                      min={0}
                      max={2147483647}
                      step={1}
                      value={timer}
                      onChange={(e) => setTimer(e.target.value)}
                      className={inputClass}
                    />
                    {fieldErrors.timerMinutes && (
                      <p className="text-sm text-red-700">{fieldErrors.timerMinutes.join(' ')}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="step-image" className="text-sm font-semibold">
                      Đường dẫn ảnh
                    </label>
                    <input
                      id="step-image"
                      type="url"
                      maxLength={500}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://…"
                      className={inputClass}
                    />
                    {fieldErrors.imageUrl && (
                      <p className="text-sm text-red-700">{fieldErrors.imageUrl.join(' ')}</p>
                    )}
                  </div>
                  {editing && (
                    <p className="text-xs text-surface-500">
                      Để trống thời gian hoặc đường dẫn ảnh sẽ giữ lại giá trị hiện có.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button type="submit" className={buttonClass}>
                      {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm bước'}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-3 py-2 text-surface-600"
                      >
                        Hủy sửa
                      </button>
                    )}
                  </div>
                </fieldset>
              </form>
            </section>
          </div>
        )}
      </div>
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-xl bg-white p-6"
          >
            <h2 id="delete-title" className="text-xl font-bold">
              Xóa bước {deleting.stepNumber}?
            </h2>
            <p className="my-4 text-surface-600">
              “{deleting.title}” sẽ bị xóa. Các bước còn lại sẽ được đánh lại số thứ tự.
            </p>
            <div>
              {error && (
                <p role="alert" className="mb-3 text-red-700">
                  {error}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                autoFocus
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-surface-300 px-4 py-2"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Đang xóa…' : 'Xác nhận xóa'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
