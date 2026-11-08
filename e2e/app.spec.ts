import { expect, test, type Page } from '@playwright/test'

const EXTERNAL =
  /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|dolarapi\.com|argentinadatos\.com|googleapis\.com|accounts\.google\.com/

test.beforeEach(async ({ page }) => {
  await page.route(EXTERNAL, (route) => route.abort())
  await page.goto('/')
})

async function addExpense(page: Page, amount: string, description: string) {
  await page.getByRole('button', { name: /Cargar a mano/ }).click()
  await page.getByLabel('Monto', { exact: true }).fill(amount)
  await page.getByLabel('Descripción', { exact: true }).fill(description)
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tally' })).toBeVisible()
}

test('carga un gasto a mano, lo ve en la lista y lo elimina', async ({
  page,
}) => {
  await addExpense(page, '2.300', 'Farmacia')

  const row = page.getByRole('button', { name: /Farmacia/ })
  await expect(row).toContainText('Salud · hoy')
  await expect(row).toContainText('$ 2.300')

  await page.getByRole('button', { name: 'Gastos' }).click()
  await expect(page.getByRole('heading', { name: /^Hoy ·/ })).toBeVisible()
  await page.getByRole('button', { name: /Farmacia/ }).click()
  await expect(page.getByText('Carga manual')).toBeVisible()
  await expect(page.getByText('USD pendiente').first()).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('button', { name: 'Sí, eliminar' }).click()
  await expect(page.getByText(/No hay gastos en/)).toBeVisible()
})

test('el gasto queda guardado al recargar la página', async ({ page }) => {
  await addExpense(page, '5000', 'SUBE')
  await page.reload()
  await expect(page.getByRole('button', { name: /SUBE/ })).toContainText(
    'Transporte',
  )
})

test('el resumen muestra el gráfico y el porcentaje por categoría', async ({
  page,
}) => {
  await addExpense(page, '30.000', 'Coto')
  await addExpense(page, '10.000', 'Rappi')
  await page.getByRole('button', { name: 'Resumen' }).click()

  await expect(page.locator('canvas')).toBeVisible()
  const legend = page.getByRole('list', { name: 'Gastos por categoría' })
  await expect(legend.getByRole('button').first()).toContainText('75,0')
  await legend.getByRole('button', { name: /Comida/ }).click()
  await expect(page.getByRole('button', { name: /Rappi/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Coto/ })).toHaveCount(0)
})

test('Ajustes cambia el idioma y el tema', async ({ page }) => {
  await page.getByRole('button', { name: 'Ajustes' }).click()
  await page
    .getByRole('group', { name: 'Tema' })
    .getByRole('button', { name: 'Oscuro' })
    .click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page
    .getByRole('group', { name: 'Idioma de la app' })
    .getByRole('button', { name: 'English' })
    .click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Home' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('ninguna pantalla se desborda a lo ancho', async ({ page }) => {
  await addExpense(page, '1.250.000', 'Heladera de dos puertas con freezer')
  for (const tab of ['Inicio', 'Gastos', 'Resumen', 'Ajustes']) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(overflow, tab).toBe(false)
  }
})
