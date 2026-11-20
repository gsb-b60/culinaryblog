import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  ApiError,
  deleteRecipeImage,
  getRecipeBySlug,
  setPrimaryRecipeImage,
  updateRecipe,
  uploadRecipeImage,
} from '../lib/api'
import { useAuthStore } from '../store'
import type { RecipeDetail, RecipeDifficulty, UpdateRecipePayload } from '../types/recipe'

const difficulties: Array<{ value: RecipeDifficulty; label: string }> = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
  { value: 'EXPERT', label: 'Chuyên sâu' },
]

type FormState = Omit<UpdateRecipePayload, 'difficulty'> & { difficulty: RecipeDifficulty }

function recipeForm(recipe: RecipeDetail): FormState {
  return {
    title: recipe.title,
    description: recipe.description,
    categoryId: recipe.categoryId,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    instructions: recipe.instructions ?? '',
    nutrition: recipe.nutrition,
  }
}

function errorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError)) return 'Không thể cập nhật công thức. Vui lòng thử lại.'
  if (reason.status === 403) return 'Bạn không có quyền thay đổi công thức này.'
  if (reason.status === 404) return 'Công thức không còn tồn tại. Hãy quay lại danh sách.'
  if (reason.status === 409) return 'Công thức vừa được thay đổi. Hãy tải phiên bản mới nhất trước khi lưu.'
  if (reason.status === 422) return 'Vui lòng kiểm tra lại các thông tin đã nhập.'
  return reason.status === 0 ? 'Không thể kết nối máy chủ. Vui lòng thử lại.' : 'Máy chủ gặp lỗi. Vui lòng thử lại sau.'
}

export default function EditRecipePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [revision, setRevision] = useState(0)
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState('')

  useEffect(() => {
    if (!session || !slug) return
    let active = true
    getRecipeBySlug(slug, session.accessToken)
      .then((loaded) => {
        if (!active) return
        setError('')
        setConflict(false)
        setRecipe(loaded)
        setForm(recipeForm(loaded))
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug, revision, session])

  if (!session) return null
  if (loading) return <div className="mx-auto max-w-3xl p-8">Đang tải công thức...</div>
  if (!recipe || !form) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error || 'Không thể tải công thức.'}</p>
        <Link className="mt-4 inline-block text-brand-700" to="/dashboard/recipes">Quay lại danh sách</Link>
      </div>
    )
  }

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => current ? { ...current, [field]: value } : current)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!session || !recipe || !form || recipe.version === undefined) {
      setError('Không xác định được phiên bản hiện tại của công thức. Hãy tải lại trang.')
      return
    }
    setSaving(true)
    setError('')
    setConflict(false)
    try {
      const updated = await updateRecipe(session.accessToken, recipe.id, {
        ...form,
        instructions: form.instructions || undefined,
      }, recipe.version)
      setRecipe(updated)
      setForm(recipeForm(updated))
      navigate('/dashboard/recipes')
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) setConflict(true)
      setError(errorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(file: File | null) {
    if (!file || !session || !recipe) return
    setImageBusy(true)
    setImageError('')
    try {
      await uploadRecipeImage(session.accessToken, recipe.id, file)
      setRevision((value) => value + 1)
    } catch (reason) {
      setImageError(errorMessage(reason))
    } finally {
      setImageBusy(false)
    }
  }

  async function handleMakePrimary(imageId: string) {
    if (!session || !recipe) return
    setImageBusy(true)
    setImageError('')
    try {
      await setPrimaryRecipeImage(session.accessToken, recipe.id, imageId)
      setRevision((value) => value + 1)
    } catch (reason) {
      setImageError(errorMessage(reason))
    } finally {
      setImageBusy(false)
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!session || !recipe) return
    setImageBusy(true)
    setImageError('')
    try {
      await deleteRecipeImage(session.accessToken, recipe.id, imageId)
      setRevision((value) => value + 1)
    } catch (reason) {
      setImageError(errorMessage(reason))
    } finally {
      setImageBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-surface-500">Công thức</p>
          <h1 className="mt-2 text-2xl font-bold">Chỉnh sửa công thức</h1>
          <p className="mt-1 text-sm text-surface-500">Phiên bản hiện tại: {recipe.version ?? 'không xác định'}</p>
        </div>
        <Link to="/dashboard/recipes" className="rounded-lg border border-surface-300 px-4 py-2 text-sm">Hủy</Link>
      </div>
      {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {conflict && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Có người khác đã cập nhật công thức này. Thay đổi của bạn chưa được ghi đè.
          <button type="button" onClick={() => setRevision((value) => value + 1)} className="ml-3 font-semibold underline">Tải phiên bản mới nhất</button>
        </div>
      )}
      <section className="mb-6 rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Ảnh món ăn</h2>
          <span className="text-xs text-surface-500">{recipe.images.length} ảnh</span>
        </div>

        {recipe.images.length === 0 ? (
          <p className="rounded-lg border-2 border-dashed border-surface-300 p-6 text-center text-sm text-surface-500">
            Chưa có ảnh nào. Ảnh đầu tiên sẽ được đặt làm ảnh chính.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {recipe.images.map((image) => (
              <li key={image.id} className="overflow-hidden rounded-lg border border-surface-200">
                <img
                  src={image.thumbnailUrl ?? image.mediumUrl ?? image.originalUrl}
                  alt={image.altText ?? recipe.title}
                  className="h-40 w-full object-cover"
                />
                <div className="space-y-2 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-surface-100 px-2 py-1">Ảnh #{image.orderIndex + 1}</span>
                    {image.isPrimary && (
                      <span className="rounded bg-brand-100 px-2 py-1 font-medium text-brand-700">Ảnh chính</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        disabled={imageBusy}
                        onClick={() => handleMakePrimary(image.id)}
                        className="rounded-lg border border-surface-300 px-3 py-2 text-xs disabled:opacity-60"
                      >
                        Đặt làm ảnh chính
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={imageBusy}
                      onClick={() => handleDeleteImage(image.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 disabled:opacity-60"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-4 block rounded-lg border-2 border-dashed border-surface-300 p-4 text-center">
          <span className="block text-sm text-surface-600">Tải thêm ảnh (JPEG, PNG, WebP, AVIF — tối đa 5 MB)</span>
          <input
            className="mt-2"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={imageBusy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              event.target.value = ''
              void handleImageUpload(file)
            }}
          />
        </label>

        {imageError && <p role="alert" className="mt-2 text-sm text-red-600">{imageError}</p>}
      </section>

      <form onSubmit={submit} className="space-y-5 rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="block"><span className="mb-1 block text-sm font-medium">Tên công thức</span><input required minLength={5} maxLength={200} value={form.title ?? ''} onChange={(event) => update('title', event.target.value)} className="w-full rounded-lg border border-surface-300 p-3" /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Mô tả</span><textarea required minLength={10} maxLength={2000} value={form.description ?? ''} onChange={(event) => update('description', event.target.value)} className="min-h-28 w-full rounded-lg border border-surface-300 p-3" /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label><span className="mb-1 block text-sm font-medium">Thời gian chuẩn bị</span><input type="number" min={1} required value={form.prepTime ?? ''} onChange={(event) => update('prepTime', Number(event.target.value))} className="w-full rounded-lg border border-surface-300 p-3" /></label>
          <label><span className="mb-1 block text-sm font-medium">Thời gian nấu</span><input type="number" min={0} required value={form.cookTime ?? ''} onChange={(event) => update('cookTime', Number(event.target.value))} className="w-full rounded-lg border border-surface-300 p-3" /></label>
          <label><span className="mb-1 block text-sm font-medium">Khẩu phần</span><input type="number" min={1} required value={form.servings ?? ''} onChange={(event) => update('servings', Number(event.target.value))} className="w-full rounded-lg border border-surface-300 p-3" /></label>
        </div>
        <label className="block"><span className="mb-1 block text-sm font-medium">Độ khó</span><select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value as RecipeDifficulty)} className="w-full rounded-lg border border-surface-300 p-3">{difficulties.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Hướng dẫn tổng quan</span><textarea maxLength={10000} value={form.instructions ?? ''} onChange={(event) => update('instructions', event.target.value)} className="min-h-32 w-full rounded-lg border border-surface-300 p-3" /></label>
        <div className="flex justify-end gap-3"><Link to="/dashboard/recipes" className="rounded-lg border border-surface-300 px-5 py-3">Hủy</Link><button disabled={saving} className="rounded-lg bg-brand-500 px-6 py-3 font-medium text-white disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
      </form>
    </div>
  )
}
