import assert from 'node:assert/strict';
import { startIngredientIntegration } from './support/ingredientIntegration.js';
const fixture = await startIngredientIntegration();
const server = fixture.app.listen(0, '127.0.0.1');
try {
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const base = 'http://127.0.0.1:' + address.port + '/api/v1/recipes';
  const category = await fixture.prisma.category.create({ data: { name: 'Sorting', slug: 'sorting' } });
  const rows = [];
  for (const [index, title] of ['Zulu soup', 'Alpha soup', 'Bravo soup', 'Bravo soup'].entries()) {
    rows.push(await fixture.prisma.recipe.create({ data: {
      title, slug: 'sort-' + index, description: 'Sorting fixture soup', authorId: fixture.owner.id,
      categoryId: category.id, prepTime: 10, cookTime: [5, 60, 30, 30][index]!, servings: 2,
      status: 'PUBLISHED', createdAt: new Date(Date.UTC(2026, 0, index + 1)),
    } }));
  }
  await fixture.prisma.recipe.create({ data: {
    title: 'Hidden soup', slug: 'hidden', description: 'Hidden fixture', authorId: fixture.owner.id,
    categoryId: category.id, prepTime: 1, cookTime: 999, servings: 2, status: 'DRAFT',
  } });
  let checks = 0;
  for (const [sort, field, desc] of [
    ['', 'createdAt', true], ['-createdAt', 'createdAt', true], ['createdAt', 'createdAt', false],
    ['title', 'title', false], ['-cookTime', 'cookTime', true],
  ] as const) {
    const expected = [...rows].sort((a, b) => {
      const x = a[field], y = b[field];
      const comparison = x < y ? -1 : x > y ? 1 : 0;
      return (desc ? -comparison : comparison) || a.id.localeCompare(b.id);
    });
    const ids: string[] = [];
    for (const page of [1, 2]) {
      const response = await fetch(base + '?pageSize=2&page=' + page + (sort ? '&sort=' + sort : ''));
      assert.equal(response.status, 200);
      const body = await response.json() as { items: { id: string }[]; meta: { totalCount: number } };
      assert.equal(body.meta.totalCount, 4);
      ids.push(...body.items.map(item => item.id));
    }
    assert.deepEqual(ids, expected.map(item => item.id), sort || 'default');
    checks++;
  }
  const search = await fetch(base + '/search?q=soup&sort=-cookTime&minServings=2');
  assert.equal(search.status, 200);
  const body = await search.json() as { items: { cookTime: number }[] };
  assert.deepEqual(body.items.map(item => item.cookTime), [60, 30, 30, 5]);
  for (const sort of ['invalid', '--title', 'constructor']) {
    assert.equal((await fetch(base + '?sort=' + sort)).status, 422);
  }
  console.log(JSON.stringify({ result: 'PASS', orderingCases: checks, search: 'PASS', invalidSort: 'PASS', stablePagination: 'PASS', publishedOnly: 'PASS' }));
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await fixture.close();
}
