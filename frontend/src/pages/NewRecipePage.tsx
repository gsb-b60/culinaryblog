import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useCategories } from "../hooks/useCategories";
import { ApiError, createRecipe, uploadRecipeImage } from "../lib/api";
import { useAuthStore } from "../store";
import type { CreateRecipePayload, RecipeDifficulty } from "../types/recipe";

type Ingredient = NonNullable<CreateRecipePayload["ingredients"]>[number];
type Step = NonNullable<CreateRecipePayload["steps"]>[number];
type NutritionKey =
  | "calories"
  | "protein"
  | "carbohydrates"
  | "fat"
  | "fiber"
  | "sodium";
type FormField =
  | "title"
  | "description"
  | "categoryId"
  | "prepTime"
  | "cookTime"
  | "servings";
type FieldErrors = Partial<Record<FormField | string, string>>;

const nutritionFields: Array<{
  key: NutritionKey;
  label: string;
  unit: string;
}> = [
  { key: "calories", label: "Năng lượng", unit: "kcal" },
  { key: "protein", label: "Chất đạm", unit: "g" },
  { key: "carbohydrates", label: "Tinh bột", unit: "g" },
  { key: "fat", label: "Chất béo", unit: "g" },
  { key: "fiber", label: "Chất xơ", unit: "g" },
  { key: "sodium", label: "Natri", unit: "mg" },
];

const emptyIngredient = (): Ingredient => ({
  name: "",
  quantity: undefined,
  unit: "",
  notes: "",
  orderIndex: 0,
});
const emptyStep = (stepNumber: number): Step => ({
  stepNumber,
  title: "",
  description: "",
  timerMinutes: undefined,
});
const formatMinutes = (value: number) =>
  value >= 60
    ? `${Math.floor(value / 60)} giờ${value % 60 ? ` ${value % 60} phút` : ""}`
    : `${value} phút`;
const inputClass =
  "w-full min-w-0 rounded-lg border border-surface-300 bg-white p-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";
const invalidInputClass =
  "border-red-400 focus:border-red-500 focus:ring-red-100";

function apiErrorMessage(cause: unknown): string {
  if (!(cause instanceof ApiError))
    return cause instanceof Error
      ? cause.message
      : "Không thể tạo công thức. Vui lòng thử lại.";
  if (cause.status === 401)
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (cause.status === 403)
    return "Tài khoản của bạn không có quyền tạo công thức.";
  if (cause.status === 409)
    return "Công thức có tiêu đề này đã tồn tại. Hãy đổi tên công thức.";
  if (cause.status === 422)
    return "Máy chủ từ chối một hoặc nhiều thông tin. Hãy kiểm tra các trường được đánh dấu.";
  if (cause.status === 0) return "Không thể kết nối máy chủ. Vui lòng thử lại.";
  return cause.message || "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
}

function apiFieldErrors(cause: unknown): FieldErrors {
  if (!(cause instanceof ApiError)) return {};
  const fields: FieldErrors = {};
  for (const [field, messages] of Object.entries(cause.problem?.errors ?? {})) {
    if (messages[0]) fields[field] = messages[0];
  }
  return fields;
}

function ingredientField(index: number, field: string): string {
  return `ingredients.${index}.${field}`;
}

function stepField(index: number, field: string): string {
  return `steps.${index}.${field}`;
}

export default function NewRecipePage() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const {
    data: categoryList,
    isLoading: categoriesLoading,
    isError: categoriesFailed,
  } = useCategories({ page: 1, pageSize: 50 });
  const categories = categoryList?.items ?? [];
  const categoriesError = categoriesFailed
    ? "Không thể tải danh mục. Vui lòng tải lại trang."
    : "";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    prepTime: 15,
    cookTime: 30,
    servings: 2,
    difficulty: "EASY" as RecipeDifficulty,
    instructions: "",
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    emptyIngredient(),
  ]);
  const [steps, setSteps] = useState<Step[]>([emptyStep(1)]);
  const [nutrition, setNutrition] = useState<Record<NutritionKey, string>>({
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    sodium: "",
  });
  const [categorySearch, setCategorySearch] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const imagePreviewUrlRef = useRef("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    };
  }, []);

  // DashboardLayout owns the redirect when the session is gone.
  if (!session) return null;

  const selectedCategory = categories.find(
    (category) => category.id === form.categoryId,
  );
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLocaleLowerCase()
      .includes(categorySearch.toLocaleLowerCase()),
  );
  const update = (field: keyof typeof form, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  };
  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    setIngredients((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "quantity"
                  ? value.trim()
                    ? Number(value)
                    : undefined
                  : value,
            }
          : item,
      ),
    );
    setFieldErrors((current) => ({
      ...current,
      [ingredientField(index, String(field))]: undefined,
    }));
    setError("");
  };
  const updateStep = (index: number, field: keyof Step, value: string) => {
    setSteps((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "timerMinutes"
                  ? value.trim()
                    ? Number(value)
                    : undefined
                  : value,
            }
          : item,
      ),
    );
    setFieldErrors((current) => ({
      ...current,
      [stepField(index, String(field))]: undefined,
    }));
    setError("");
  };
  const moveItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  function showValidation(
    message: string,
    nextStep: number,
    errors: FieldErrors = {},
  ) {
    setStep(nextStep);
    setError(message);
    setFieldErrors(errors);
  }

  function validateBasic(): boolean {
    const errors: FieldErrors = {};
    if (form.title.trim().length < 5)
      errors.title = "Tên công thức phải có ít nhất 5 ký tự.";
    if (form.title.trim().length > 200)
      errors.title = "Tên công thức không được quá 200 ký tự.";
    if (form.description.trim().length < 10)
      errors.description = "Mô tả phải có ít nhất 10 ký tự.";
    if (form.description.trim().length > 2000)
      errors.description = "Mô tả không được quá 2.000 ký tự.";
    if (!form.categoryId)
      errors.categoryId = "Vui lòng chọn một danh mục trong danh sách.";
    if (
      !Number.isInteger(form.prepTime) ||
      form.prepTime < 1 ||
      form.prepTime > 4320
    )
      errors.prepTime = "Thời gian chuẩn bị phải từ 1 đến 4.320 phút.";
    if (
      !Number.isInteger(form.cookTime) ||
      form.cookTime < 0 ||
      form.cookTime > 4320
    )
      errors.cookTime = "Thời gian nấu phải từ 0 đến 4.320 phút.";
    if (
      !Number.isInteger(form.servings) ||
      form.servings < 1 ||
      form.servings > 100
    )
      errors.servings = "Số khẩu phần phải từ 1 đến 100.";
    if (Object.keys(errors).length) {
      showValidation(
        "Hãy sửa các thông tin cơ bản được đánh dấu trước khi tiếp tục.",
        1,
        errors,
      );
      return false;
    }
    return true;
  }

  function validateDetails(): boolean {
    const errors: FieldErrors = {};
    ingredients.forEach((item, index) => {
      if (!item.name.trim())
        errors[ingredientField(index, "name")] =
          `Hãy nhập tên nguyên liệu ${index + 1}.`;
      if (
        item.quantity !== undefined &&
        (!Number.isFinite(item.quantity) || item.quantity <= 0)
      )
        errors[ingredientField(index, "quantity")] =
          "Số lượng phải lớn hơn 0 hoặc để trống nếu dùng tùy ý.";
    });
    steps.forEach((item, index) => {
      if (!item.title.trim())
        errors[stepField(index, "title")] = `Hãy nhập tên bước ${index + 1}.`;
      if (!item.description.trim())
        errors[stepField(index, "description")] =
          `Hãy nhập hướng dẫn cho bước ${index + 1}.`;
      if (
        item.timerMinutes !== undefined &&
        (!Number.isInteger(item.timerMinutes) || item.timerMinutes < 0)
      )
        errors[stepField(index, "timerMinutes")] =
          "Thời gian phải là số phút nguyên không âm.";
    });
    if (Object.keys(errors).length) {
      const firstError = Object.keys(errors)[0] ?? "";
      showValidation(
        errors[firstError] ?? "Hãy kiểm tra nguyên liệu và các bước nấu.",
        2,
        errors,
      );
      return false;
    }
    return true;
  }

  function validateNutrition(): boolean {
    const errors: FieldErrors = {};
    nutritionFields.forEach(({ key, label }) => {
      const rawValue = nutrition[key].trim();
      if (!rawValue) return;
      const value = Number(rawValue);
      if (!Number.isFinite(value) || value < 0)
        errors[`nutrition.${key}`] =
          `${label} phải là số không âm hoặc để trống.`;
    });
    if (Object.keys(errors).length) {
      showValidation(
        "Hãy sửa các giá trị dinh dưỡng được đánh dấu.",
        3,
        errors,
      );
      return false;
    }
    return true;
  }

  function validateCurrentStep(): boolean {
    if (step === 1) return validateBasic();
    if (step === 2) return validateDetails();
    return validateBasic() && validateDetails() && validateNutrition();
  }

  function goNext() {
    if (validateCurrentStep()) {
      setError("");
      setFieldErrors({});
      setStep((current) => Math.min(current + 1, 3));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    // Only the final step may create a recipe. This guard also protects the
    // wizard if the browser submits the form via Enter or an unexpected
    // submit event while the user is on step 1 or 2.
    if (step !== 3) return;
    if (!validateCurrentStep()) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    const accessToken = useAuthStore.getState().session?.accessToken;
    if (!accessToken) {
      setSaving(false);
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    const nutritionPayload = Object.fromEntries(
      Object.entries(nutrition)
        .filter(([, value]) => value.trim() && Number(value) > 0)
        .map(([key, value]) => [key, Number(value)]),
    ) as CreateRecipePayload["nutrition"];
    const payload: CreateRecipePayload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim() || undefined,
      ingredients: ingredients.map((item, index) => ({
        ...item,
        name: item.name.trim(),
        unit: item.unit?.trim() || undefined,
        notes: item.notes?.trim() || undefined,
        orderIndex: index,
      })),
      steps: steps.map((item, index) => ({
        ...item,
        title: item.title.trim(),
        description: item.description.trim(),
        stepNumber: index + 1,
      })),
      nutrition: Object.keys(nutritionPayload ?? {}).length
        ? nutritionPayload
        : undefined,
    };
    try {
      const created = await createRecipe(accessToken, payload);
      if (image) {
        setUploadProgress(0);
        try {
          await uploadRecipeImage(
            accessToken,
            created.id,
            image,
            setUploadProgress,
          );
        } catch (cause) {
          setError(
            `Đã tạo bản nháp thành công nhưng không thể tải ảnh lên. ${apiErrorMessage(cause)}`,
          );
          setSaving(false);
          return;
        }
      }
      navigate("/dashboard/recipes");
    } catch (cause) {
      setError(apiErrorMessage(cause));
      setFieldErrors(apiFieldErrors(cause));
      const errors = apiFieldErrors(cause);
      if (
        Object.keys(errors).some(
          (key) => key.startsWith("ingredients.") || key.startsWith("steps."),
        )
      )
        setStep(2);
      else if (
        Object.keys(errors).length ||
        (cause instanceof ApiError && cause.status === 422)
      )
        setStep(1);
    } finally {
      setSaving(false);
    }
  }

  function selectImage(file: File | null) {
    if (!file) return;
    const acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];
    if (!acceptedTypes.includes(file.type)) {
      setError("Ảnh phải có định dạng JPEG, PNG, WebP hoặc AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được lớn hơn 5 MB.");
      return;
    }
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    imagePreviewUrlRef.current = previewUrl;
    setImage(file);
    setImagePreviewUrl(previewUrl);
    setError("");
  }

  function removeImage() {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = "";
    setImage(null);
    setImagePreviewUrl("");
    setUploadProgress(0);
    setError("");
  }

  const fieldClass = (field: string) =>
    `${inputClass} ${fieldErrors[field] ? invalidInputClass : ""}`;
  const errorText = (field: string) =>
    fieldErrors[field] ? (
      <p className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-surface-500">Công thức</p>
          <h1 className="mt-2 text-2xl font-bold text-surface-900">
            Tạo công thức mới
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Bản nháp chưa được công khai.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard/recipes")}
          className="shrink-0 rounded-lg border border-surface-300 px-4 py-2 text-sm hover:bg-surface-50"
        >
          Hủy
        </button>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {[
          "Thông tin cơ bản",
          "Nguyên liệu & bước",
          "Ảnh, dinh dưỡng & lưu",
        ].map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => {
              if (index + 1 <= step) {
                setStep(index + 1);
                setError("");
              }
            }}
            className={`rounded-lg p-3 text-center text-xs font-medium sm:text-sm ${step === index + 1 ? "bg-brand-500 text-white" : step > index + 1 ? "bg-brand-100 text-brand-700" : "bg-surface-100 text-surface-500"}`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Không thể tiếp tục</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-6">
        {step === 1 && (
          <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-1 font-bold">Thông tin cơ bản</h2>
            <p className="mb-5 text-sm text-surface-500">
              Các trường có dấu * là bắt buộc.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">
                  Tên công thức *
                </span>
                <input
                  required
                  minLength={5}
                  maxLength={200}
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  className={fieldClass("title")}
                  placeholder="Ví dụ: Phở bò Hà Nội"
                  aria-invalid={Boolean(fieldErrors.title)}
                />
                {errorText("title")}
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">Mô tả *</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  className={`${fieldClass("description")} min-h-28`}
                  placeholder="Món ăn này có gì đặc biệt?"
                  aria-invalid={Boolean(fieldErrors.description)}
                />
                {errorText("description")}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Danh mục *
                </span>
                <input
                  required
                  role="combobox"
                  list="recipe-categories"
                  value={categorySearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCategorySearch(value);
                    const selected = categories.find(
                      (category) => category.name === value,
                    );
                    update("categoryId", selected?.id ?? "");
                  }}
                  disabled={categoriesLoading || Boolean(categoriesError)}
                  className={fieldClass("categoryId")}
                  aria-label="Danh mục"
                  aria-invalid={Boolean(fieldErrors.categoryId)}
                  placeholder={
                    categoriesLoading
                      ? "Đang tải danh mục..."
                      : categoriesError
                        ? "Không thể tải danh mục"
                        : "Tìm và chọn danh mục"
                  }
                  autoComplete="off"
                />
                {!categoriesLoading && !categoriesError && (
                  <datalist id="recipe-categories">
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.name} />
                    ))}
                  </datalist>
                )}
                {selectedCategory && (
                  <p className="mt-1 text-xs text-surface-500">
                    Đã chọn: {selectedCategory.name}
                  </p>
                )}
                {categoriesError && (
                  <p className="mt-1 text-sm text-red-600">{categoriesError}</p>
                )}
                {errorText("categoryId")}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Độ khó</span>
                <select
                  value={form.difficulty}
                  onChange={(event) =>
                    update("difficulty", event.target.value as RecipeDifficulty)
                  }
                  className={inputClass}
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                  <option value="EXPERT">Chuyên sâu</option>
                </select>
              </label>
              <label className="flex flex-col">
                <span className="mb-1 block text-sm font-medium">
                  Thời gian chuẩn bị *
                </span>
                <div className="mt-1 flex flex-col items-center gap-3">
                  <input
                    aria-label="Thanh thời gian chuẩn bị"
                    type="range"
                    min={1}
                    max={180}
                    step={5}
                    value={Math.min(form.prepTime, 180)}
                    onChange={(event) =>
                      update("prepTime", Number(event.target.value))
                    }
                    className="w-full max-w-md accent-brand-500"
                  />
                  <input
                    aria-label="Số phút chuẩn bị"
                    type="number"
                    min={1}
                    max={4320}
                    value={form.prepTime}
                    onChange={(event) =>
                      update("prepTime", Number(event.target.value))
                    }
                    className={`${fieldClass("prepTime")} w-24 shrink-0`}
                  />
                </div>
                <p className="mt-1 text-xs text-surface-500">
                  {formatMinutes(form.prepTime)} · kéo thanh trượt hoặc nhập số
                  phút
                </p>
                {errorText("prepTime")}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Thời gian nấu *
                </span>
                <div className="mt-1 flex flex-col items-center gap-3">
                  <input
                    aria-label="Thanh thời gian nấu"
                    type="range"
                    min={0}
                    max={300}
                    step={5}
                    value={Math.min(form.cookTime, 300)}
                    onChange={(event) =>
                      update("cookTime", Number(event.target.value))
                    }
                    className="w-full max-w-md accent-brand-500"
                  />
                  <input
                    aria-label="Số phút nấu"
                    type="number"
                    min={0}
                    max={4320}
                    value={form.cookTime}
                    onChange={(event) =>
                      update("cookTime", Number(event.target.value))
                    }
                    className={`${fieldClass("cookTime")} w-24 shrink-0`}
                  />
                </div>
                <p className="mt-1 text-xs text-surface-500">
                  {formatMinutes(form.cookTime)} · kéo thanh trượt hoặc nhập số
                  phút
                </p>
                {errorText("cookTime")}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Số khẩu phần *
                </span>
                <input
                  aria-label="Số khẩu phần"
                  type="number"
                  min={1}
                  max={100}
                  value={form.servings}
                  onChange={(event) =>
                    update("servings", Number(event.target.value))
                  }
                  className={fieldClass("servings")}
                />
                {errorText("servings")}
              </label>
            </div>
          </section>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">Nguyên liệu</h2>
                  <p className="mt-1 text-sm text-surface-500">
                    Nhập tên, số lượng và đơn vị riêng. Ví dụ:{" "}
                    <strong>2</strong> | <strong>củ</strong> |{" "}
                    <strong>cà rốt</strong>. Số lượng có thể để trống cho nguyên
                    liệu “tùy khẩu vị”.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setIngredients((current) => [...current, emptyIngredient()])
                  }
                  className="rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-200"
                >
                  + Thêm nguyên liệu
                </button>
              </div>
              <div className="space-y-4">
                {ingredients.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-surface-200 bg-surface-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Nguyên liệu {index + 1}</h3>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          aria-label={`Đưa nguyên liệu ${index + 1} lên`}
                          onClick={() =>
                            setIngredients(moveItem(ingredients, index, -1))
                          }
                          className="rounded border border-surface-300 bg-white px-2 py-1 text-sm"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Đưa nguyên liệu ${index + 1} xuống`}
                          onClick={() =>
                            setIngredients(moveItem(ingredients, index, 1))
                          }
                          className="rounded border border-surface-300 bg-white px-2 py-1 text-sm"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa nguyên liệu ${index + 1}`}
                          onClick={() =>
                            setIngredients((current) =>
                              current.length > 1
                                ? current.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  )
                                : [emptyIngredient()],
                            )
                          }
                          className="rounded border border-red-200 bg-white px-2 py-1 text-sm text-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <label>
                        <span className="mb-1 block text-sm font-medium">
                          Tên nguyên liệu *
                        </span>
                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateIngredient(index, "name", event.target.value)
                          }
                          className={fieldClass(ingredientField(index, "name"))}
                          placeholder="Tên nguyên liệu"
                        />
                        {errorText(ingredientField(index, "name"))}
                      </label>
                      <label>
                        <span className="mb-1 block text-sm font-medium">
                          Số lượng
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity ?? ""}
                          onChange={(event) =>
                            updateIngredient(
                              index,
                              "quantity",
                              event.target.value,
                            )
                          }
                          className={fieldClass(
                            ingredientField(index, "quantity"),
                          )}
                          placeholder="Số lượng"
                        />
                        {errorText(ingredientField(index, "quantity"))}
                      </label>
                      <label>
                        <span className="mb-1 block text-sm font-medium">
                          Đơn vị
                        </span>
                        <input
                          value={item.unit ?? ""}
                          onChange={(event) =>
                            updateIngredient(index, "unit", event.target.value)
                          }
                          className={inputClass}
                          placeholder="củ, gam, ml..."
                        />
                      </label>
                      <label className="sm:col-span-3">
                        <span className="mb-1 block text-sm font-medium">
                          Ghi chú
                        </span>
                        <input
                          value={item.notes ?? ""}
                          onChange={(event) =>
                            updateIngredient(index, "notes", event.target.value)
                          }
                          className={inputClass}
                          placeholder="Ví dụ: gọt vỏ, cắt lát"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">Các bước nấu</h2>
                  <p className="mt-1 text-sm text-surface-500">
                    Mỗi bước cần tên và hướng dẫn rõ ràng. Thời gian là tùy
                    chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSteps((current) => [
                      ...current,
                      emptyStep(current.length + 1),
                    ])
                  }
                  className="rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-200"
                >
                  + Thêm bước
                </button>
              </div>
              <div className="space-y-4">
                {steps.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-surface-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-brand-700">
                        Bước {index + 1}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          aria-label={`Đưa bước ${index + 1} lên`}
                          onClick={() => setSteps(moveItem(steps, index, -1))}
                          className="rounded border border-surface-300 px-2 py-1 text-sm"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Đưa bước ${index + 1} xuống`}
                          onClick={() => setSteps(moveItem(steps, index, 1))}
                          className="rounded border border-surface-300 px-2 py-1 text-sm"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa bước ${index + 1}`}
                          onClick={() =>
                            setSteps((current) =>
                              current.length > 1
                                ? current.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  )
                                : [emptyStep(1)],
                            )
                          }
                          className="rounded border border-red-200 px-2 py-1 text-sm text-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <label>
                        <span className="mb-1 block text-sm font-medium">
                          Tên bước *
                        </span>
                        <input
                          value={item.title}
                          onChange={(event) =>
                            updateStep(index, "title", event.target.value)
                          }
                          className={fieldClass(stepField(index, "title"))}
                          placeholder="Tên bước"
                        />
                        {errorText(stepField(index, "title"))}
                      </label>
                      <label>
                        <span className="mb-1 block text-sm font-medium">
                          Thời gian (phút)
                        </span>
                        <div className="flex flex-col items-center gap-3">
                          <input
                            aria-label={`Thanh thời gian bước ${index + 1}`}
                            type="range"
                            min={0}
                            max={300}
                            step={5}
                            value={Math.min(item.timerMinutes ?? 0, 300)}
                            onChange={(event) =>
                              updateStep(
                                index,
                                "timerMinutes",
                                event.target.value,
                              )
                            }
                            className="w-full max-w-md accent-brand-500"
                          />
                          <input
                            aria-label={`Số phút bước ${index + 1}`}
                            type="number"
                            min={0}
                            max={4320}
                            value={item.timerMinutes ?? ""}
                            onChange={(event) =>
                              updateStep(
                                index,
                                "timerMinutes",
                                event.target.value,
                              )
                            }
                            className={`${fieldClass(stepField(index, "timerMinutes"))} w-24 shrink-0`}
                            placeholder="--"
                          />
                        </div>
                        <p className="mt-1 text-xs text-surface-500">
                          {item.timerMinutes === undefined
                            ? "Không đặt"
                            : formatMinutes(item.timerMinutes)}
                        </p>
                        {errorText(stepField(index, "timerMinutes"))}
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-sm font-medium">
                          Hướng dẫn thực hiện *
                        </span>
                        <textarea
                          value={item.description}
                          onChange={(event) =>
                            updateStep(index, "description", event.target.value)
                          }
                          className={`${fieldClass(stepField(index, "description"))} min-h-24`}
                          placeholder="Mô tả chi tiết bước nấu"
                        />
                        {errorText(stepField(index, "description"))}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 font-bold">Ảnh món ăn (không bắt buộc)</h2>
              <label className="block rounded-lg border-2 border-dashed border-surface-300 p-6 text-center hover:border-brand-400">
                <span className="block text-sm text-surface-600">
                  Chọn JPEG, PNG, WebP hoặc AVIF (tối đa 5 MB)
                </span>
                <input
                  ref={imageInputRef}
                  aria-label="Ảnh món ăn"
                  className="mt-3 max-w-full"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) =>
                    selectImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              {image && imagePreviewUrl && (
                <div className="mt-4 overflow-hidden rounded-lg border border-surface-200 bg-surface-50">
                  <img src={imagePreviewUrl} alt={`Xem trước ${image.name}`} className="h-56 w-full object-cover sm:h-72" />
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <p className="min-w-0 truncate text-sm text-surface-600">
                      Đã chọn: {image.name}
                      {uploadProgress > 0 && ` — ${uploadProgress}%`}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => imageInputRef.current?.click()} disabled={saving} className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm hover:bg-surface-50 disabled:opacity-50">Đổi ảnh</button>
                      <button type="button" onClick={removeImage} disabled={saving} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">Xóa ảnh</button>
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-surface-500">
                Ảnh không bắt buộc. Công thức chỉ được tạo khi bạn bấm “Lưu bản
                nháp”. Ảnh sẽ được tải lên sau khi bản nháp được tạo.
              </p>
            </section>
            <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-2 font-bold">
                Dinh dưỡng mỗi khẩu phần (không bắt buộc)
              </h2>
              <p className="mb-5 text-sm text-surface-500">
                Để trống nếu bạn chưa biết. Giá trị 0 sẽ được bỏ qua.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nutritionFields.map((field) => (
                  <label key={field.key}>
                    <span className="mb-1 block text-sm font-medium">
                      {field.label}{" "}
                      <span className="text-surface-400">({field.unit})</span>
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={nutrition[field.key]}
                        onChange={(event) => {
                          setNutrition((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            [`nutrition.${field.key}`]: undefined,
                          }));
                          setError("");
                        }}
                        className={`${inputClass} pr-14 ${fieldErrors[`nutrition.${field.key}`] ? invalidInputClass : ""}`}
                        placeholder="0"
                        aria-invalid={Boolean(
                          fieldErrors[`nutrition.${field.key}`],
                        )}
                      />
                      <span className="absolute right-3 top-3 text-sm text-surface-400">
                        {field.unit}
                      </span>
                    </div>
                    {errorText(`nutrition.${field.key}`)}
                  </label>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 font-bold">Hướng dẫn tổng quan</h2>
              <textarea
                value={form.instructions}
                onChange={(event) => update("instructions", event.target.value)}
                className="min-h-32 w-full rounded-lg border border-surface-300 p-3"
                placeholder="Ghi chú hoặc hướng dẫn bổ sung..."
              />
            </section>
            <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 font-bold">Xem trước bản nháp</h2>
              <div className="rounded-lg bg-surface-50 p-4">
                {image && imagePreviewUrl ? (
                  <div className="mb-4 overflow-hidden rounded-lg border border-surface-200 bg-white">
                    <img
                      src={imagePreviewUrl}
                      alt="Ảnh món ăn trong bản xem trước"
                      className="h-48 w-full object-cover sm:h-64"
                    />
                    <p className="truncate px-3 py-2 text-xs text-surface-500">
                      Ảnh đại diện: {image.name}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-surface-300 text-sm text-surface-500">
                    Chưa có ảnh món ăn
                  </div>
                )}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    Bản nháp
                  </span>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                    {selectedCategory?.name || "Chưa chọn danh mục"}
                  </span>
                  <span className="rounded-full bg-surface-200 px-3 py-1 text-xs font-medium">
                    {form.difficulty === "EASY"
                      ? "Dễ"
                      : form.difficulty === "MEDIUM"
                        ? "Trung bình"
                        : form.difficulty === "HARD"
                          ? "Khó"
                          : "Chuyên sâu"}
                  </span>
                </div>
                <h3 className="text-xl font-bold">
                  {form.title || "Tên công thức"}
                </h3>
                <p className="mt-2 text-sm text-surface-600">
                  {form.description || "Mô tả công thức"}
                </p>
                <div className="my-4 grid gap-3 border-y border-surface-200 py-4 text-sm sm:grid-cols-3">
                  <span>
                    <strong>Chuẩn bị:</strong> {formatMinutes(form.prepTime)}
                  </span>
                  <span>
                    <strong>Nấu:</strong> {formatMinutes(form.cookTime)}
                  </span>
                  <span>
                    <strong>Khẩu phần:</strong> {form.servings} người
                  </span>
                </div>
                <h4 className="font-semibold">
                  Nguyên liệu (
                  {ingredients.filter((item) => item.name.trim()).length})
                </h4>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {ingredients
                    .filter((item) => item.name.trim())
                    .map((item, index) => (
                      <li key={index}>
                        {item.quantity ? `${item.quantity} ` : ""}
                        {item.unit ? `${item.unit} ` : ""}
                        {item.name}
                        {item.notes ? ` — ${item.notes}` : ""}
                      </li>
                    ))}
                </ul>
                <h4 className="mt-4 font-semibold">
                  Các bước ({steps.filter((item) => item.title.trim()).length})
                </h4>
                <ol className="mt-2 space-y-2 text-sm">
                  {steps
                    .filter((item) => item.title.trim())
                    .map((item, index) => (
                      <li key={index}>
                        <strong>
                          {index + 1}. {item.title}
                        </strong>
                        {item.timerMinutes !== undefined
                          ? ` (${formatMinutes(item.timerMinutes)})`
                          : ""}
                        <p className="text-surface-600">{item.description}</p>
                      </li>
                    ))}
                </ol>
              </div>
            </section>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            disabled={step === 1 || saving}
            onClick={() => {
              setStep((current) => current - 1);
              setError("");
              setFieldErrors({});
            }}
            className="rounded-lg border border-surface-300 px-5 py-3 disabled:opacity-40"
          >
            Quay lại
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
            >
              Tiếp theo
            </button>
          ) : (
            <button
              disabled={saving || categoriesLoading || categories.length === 0}
              className="rounded-lg bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu bản nháp"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
