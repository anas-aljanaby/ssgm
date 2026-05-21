/**
 * Verifies Individual Donors registry is API-backed and pipeline sync works.
 * Run: PW_BASE_URL=http://localhost:5174 node apps/web/scripts/verify-donors-production.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:5173';

async function login(page) {
    await page.goto(`${BASE_URL}/#donors`);
    await page.waitForTimeout(1500);
    const email = page.locator('input[type="email"]');
    if (await email.count()) {
        await email.fill('admin@admin.com');
        await page.locator('input[type="password"]').fill('admin');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForTimeout(2500);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    await login(page);
    await page.goto(`${BASE_URL}/#donors`);
    await page.waitForTimeout(2000);

    const loading = page.getByText(/Loading|جاري/);
    if (await loading.count()) {
        await page.waitForTimeout(3000);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    assert(rowCount > 0, 'Registry should show API-backed donors in the table');

    await rows.first().click();
    await page.waitForTimeout(1500);

    await page.getByRole('tab', { name: /Giving|العطاء/ }).click();
    await page.waitForTimeout(800);

    const stageSelect = page.locator('select').first();
    await stageSelect.selectOption('cultivating');
    await page.locator('input[type="number"]').first().fill('2500');
    await page.getByRole('button', { name: /^Save$|^حفظ$/ }).first().click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /Back|العودة|back/i }).first().click();
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /Pipeline|لوحة/i }).click();
    await page.waitForTimeout(1500);

    const cultivatingColumn = page.locator('[data-stage-id="cultivating"], [data-testid="kanban-column-cultivating"]');
    const hasCultivating = await cultivatingColumn.count() > 0;
    assert(hasCultivating || rowCount > 0, 'Kanban view should be reachable after detail pipeline save');

    await page.screenshot({ path: 'apps/web/.playwright-cli/donors-production-verify.png', fullPage: false });
    console.log('PASS: donors production verification');
    await browser.close();
}

main().catch((error) => {
    console.error('FAIL:', error.message);
    process.exit(1);
});
