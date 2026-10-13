import { expect, test } from '@playwright/test'

const api = 'http://localhost:5051/api/v1'
interface Recipe {
  id: string
  categoryId: string
  difficulty: string
  cookTime: number
  servings: number
}

test('filters real PostgreSQL recipes through the UI, URL, pagination and reset', async ({ page, request }) => {
  const initial = await request.get(api + '/recipes?pageSize=50')
  expect(initial.ok(), 'Backend must connect to a populated PostgreSQL database').toBeTruthy()
  const initialBody = await initial.json()
  expect(initialBody.items.length, 'Seed recipes before running E2E').toBeGreaterThan(0)
  const sample: Recipe = initialBody.items[0]
  const categoryResponse = await request.get(api + '/categories?pageSize=50')
  expect(categoryResponse.ok()).toBeTruthy()

  await page.goto('/recipes')
  await expect(page.getByRole('status')).toHaveText('Tìm thấy ' + initialBody.meta.totalCount + ' công thức phù hợp')
  await expect(page.getByLabel('Danh mục', { exact: true })).toBeEnabled()
  await page.getByLabel('Danh mục', { exact: true }).selectOption(sample.categoryId)
  await page.getByLabel('Độ khó', { exact: true }).selectOption(sample.difficulty)
  await page.getByLabel('Thời gian nấu tối đa (phút)').fill(String(sample.cookTime))
  await page.getByLabel('Số khẩu phần tối thiểu').fill(String(sample.servings))
  await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click()
  await expect(page).toHaveURL(/categoryId=.*difficulty=.*maxCookTime=.*minServings=.*page=1/)
  const filteredURL = new URL(page.url())
  const expected = await request.get(api + '/recipes?' + filteredURL.searchParams.toString())
  expect(expected.ok()).toBeTruthy()
  const body = await expected.json()
  await expect(page.getByRole('status')).toHaveText('Tìm thấy ' + body.meta.totalCount + ' công thức phù hợp')
  await expect(page.getByTestId('recipe-card')).toHaveCount(body.items.length)
  expect(body.items.length).toBeGreaterThan(0)
  for (const recipe of body.items as Recipe[]) {
    expect(recipe.categoryId).toBe(sample.categoryId)
    expect(recipe.difficulty).toBe(sample.difficulty)
    expect(recipe.cookTime).toBeLessThanOrEqual(sample.cookTime)
    expect(recipe.servings).toBeGreaterThanOrEqual(sample.servings)
  }
  await page.reload()
  await expect(page.getByLabel('Danh mục', { exact: true })).toBeEnabled()
  await expect(page.getByLabel('Danh mục', { exact: true })).toHaveValue(sample.categoryId)
  await expect(page.getByLabel('Thời gian nấu tối đa (phút)')).toHaveValue(String(sample.cookTime))
  await expect(page.getByRole('status')).toHaveText('Tìm thấy ' + body.meta.totalCount + ' công thức phù hợp')
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()
  await expect(page).toHaveURL(/\/recipes$/)
  await expect(page.getByRole('status')).toHaveText('Tìm thấy ' + initialBody.meta.totalCount + ' công thức phù hợp')

  if (initialBody.meta.totalCount > 12) {
    const firstPage = await request.get(api + '/recipes?page=1&pageSize=12')
    const first = await firstPage.json()
    await page.getByRole('button', { name: 'Trang sau' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText(/Trang 2 \/ /)).toBeVisible()
    const secondPage = await request.get(api + '/recipes?page=2&pageSize=12')
    const second = await secondPage.json()
    expect(second.meta.totalCount).toBe(first.meta.totalCount)
    const firstIds = new Set(first.items.map((recipe: Recipe) => recipe.id))
    expect(second.items.every((recipe: Recipe) => !firstIds.has(recipe.id))).toBeTruthy()
    await page.goBack()
    await expect(page.getByText(/Trang 1 \/ /)).toBeVisible()
  }

  await page.getByLabel('Số khẩu phần tối thiểu').fill('2147483647')
  await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click()
  await expect(page.getByRole('heading', { name: 'Không có công thức phù hợp' })).toBeVisible()
})

test('validates input and recovers after an API failure', async ({ page }) => {
  await page.goto('/recipes')
  await expect(page.getByRole('status')).toContainText('Tìm thấy')
  await page.getByLabel('Số khẩu phần tối thiểu').fill('0')
  await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click()
  await expect(page.getByText('Nhập số nguyên từ 1 đến 2147483647.')).toBeVisible()
  await expect(page).toHaveURL(/\/recipes$/)

  await page.route('**/api/v1/recipes?*', route => route.abort())
  await page.goto('/recipes?difficulty=Easy')
  await expect(page.getByRole('alert')).toContainText('Không tải được công thức')
  await page.unroute('**/api/v1/recipes?*')
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Tìm thấy')
})

test('keeps filter controls usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/recipes')
  await expect(page.getByRole('status')).toContainText('Tìm thấy')
  await expect(page.getByLabel('Độ khó', { exact: true })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('opens recipes inside the dashboard and keeps the sidebar through filtering and reload', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('culinary_session', JSON.stringify({
    accessToken: 'test-session', refreshToken: 'test-session',
    user: { id: 'test-user', fullName: 'Admin', email: 'admin@example.com', roles: ['ADMIN'] },
  })))
  await page.goto('/dashboard')
  const sidebar = page.getByRole('navigation', { name: 'Dashboard menu' })
  await sidebar.getByRole('link', { name: 'Công thức', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard\/recipes$/)
  await expect(sidebar).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Công thức', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: 'Công thức nấu ăn' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Tìm thấy')
  await expect(page.getByRole('button', { name: 'Áp dụng bộ lọc' })).toBeEnabled()
  await page.getByLabel('Độ khó', { exact: true }).selectOption('EASY')
  await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click()
  await expect(page).toHaveURL(/\/dashboard\/recipes\?/)
  await expect(page.getByRole('status')).toContainText('Tìm thấy')
  await page.reload()
  await expect(sidebar).toBeVisible()
  await expect(page.getByLabel('Độ khó', { exact: true })).toHaveValue('EASY')
  await expect(page.getByRole('status')).toContainText('Tìm thấy')
  await page.screenshot({ path: 'test-results/dashboard-recipes.png', fullPage: true })
  await sidebar.getByRole('link', { name: 'Tổng quan', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Xin chào, Admin!' })).toBeVisible()
})
