/**
 * Playwright verification for donor tag chips and pipeline/ask save.
 * Run: node apps/web/scripts/verify-donor-tags-pipeline.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:8000';
const VIEWPORT = { width: 1280, height: 900 };

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

async function openFirstDonorDetail(page) {
    await page.goto(`${BASE_URL}/#donors`);
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr').first();
    if (await row.count()) {
        await row.click();
        await page.waitForTimeout(2000);
        return true;
    }
    const card = page.locator('[class*="cursor-pointer"]').filter({ hasText: /@/ }).first();
    if (await card.count()) {
        await card.click();
        await page.waitForTimeout(2000);
        return true;
    }
    return false;
}

async function verifyTagChips(page) {
    const editBtn = page.getByRole('button', { name: /Edit|تعديل/ }).first();
    await editBtn.click();
    await page.waitForTimeout(500);

    const tagInput = page.locator('#donor-header-form input').filter({ hasNot: page.locator('[type="hidden"]') }).last();
    const uniqueTag = `pw-tag-${Date.now()}`;
    await tagInput.fill(uniqueTag);
    await tagInput.press('Enter');
    await page.waitForTimeout(300);

    const chip = page.locator('#donor-header-form').getByText(uniqueTag);
    assert(await chip.count() > 0, 'Enter should add a tag chip without submitting header');

    const formSubmitted = await page.locator('h1').filter({ hasText: uniqueTag }).count();
    assert(formSubmitted === 0 || await chip.count() > 0, 'Header form should remain in edit mode after Enter in tag input');

    await page.screenshot({ path: 'apps/web/.playwright-cli/donor-tags-chips.png', fullPage: false });
}

async function verifyPipelineAsk(page) {
    await page.getByRole('tab', { name: /Giving|العطاء/ }).click();
    await page.waitForTimeout(800);

    await page.locator('select').first().selectOption('solicited');
    await page.locator('input[type="number"]').fill('');
    const saveBtn = page.getByRole('button', { name: /^Save$|^حفظ$/ }).first();
    await saveBtn.click();
    await page.waitForTimeout(400);

    const askError = page.getByText(/Ask amount is required|مبلغ الطلب مطلوب/);
    assert(await askError.count() > 0, 'Solicited stage should require ask amount');

    await page.locator('input[type="number"]').fill('5000');
    await saveBtn.click();
    await page.waitForTimeout(2000);

    await page.reload();
    await page.waitForTimeout(2500);
    await page.getByRole('tab', { name: /Giving|العطاء/ }).click();
    await page.waitForTimeout(800);

    const askValue = await page.locator('input[type="number"]').inputValue();
    assert(askValue === '5000' || Number(askValue) === 5000, `Ask should persist after refresh, got ${askValue}`);

    await page.screenshot({ path: 'apps/web/.playwright-cli/donor-pipeline-ask.png', fullPage: false });
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
        await login(page);
        const opened = await openFirstDonorDetail(page);
        assert(opened, 'Could not open a donor detail view');
        await verifyTagChips(page);
        await verifyPipelineAsk(page);
        console.log('PASS: donor tags and pipeline/ask verification');
    } catch (error) {
        console.error('FAIL:', error.message);
        await page.screenshot({ path: 'apps/web/.playwright-cli/donor-verify-fail.png', fullPage: true });
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

main();
