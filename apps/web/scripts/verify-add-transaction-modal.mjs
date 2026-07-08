/**
 * Playwright verification for Add Transaction modal grid alignment.
 * Run: node apps/web/scripts/verify-add-transaction-modal.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:8000';
const VIEWPORT = { width: 1280, height: 900 };

async function login(page) {
  await page.goto(`${BASE_URL}/#financials`);
  await page.waitForTimeout(1500);
  const email = page.locator('input[type="email"]');
  if (await email.count()) {
    await email.fill('admin@admin.com');
    await page.locator('input[type="password"]').fill('admin');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(2500);
  }
}

async function openTransactionModal(page) {
  if (await page.locator('[role=dialog]').count()) {
    await page.getByRole('button', { name: /Cancel|إلغاء/ }).click();
    await page.waitForTimeout(300);
  }
  await page.getByRole('button', { name: /Transactions|المعاملات/ }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Add Transaction|إضافة معاملة/ }).click();
  await page.waitForTimeout(600);
}

async function measureGrid(page) {
  return page.locator('[data-testid=txn-form-grid]').evaluate((grid) => {
    const fields = [...grid.children].filter((el) => el.querySelector('label'));
    return fields.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: el.querySelector('label')?.textContent?.trim() ?? '',
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      };
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifyLocale(page, locale) {
  if (locale === 'ar') {
    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: /العربية/ }).click();
    await page.waitForTimeout(1000);
  }

  await openTransactionModal(page);

  const fields = await measureGrid(page);
  assert(fields.length >= 5, `Expected 5+ grid fields, got ${fields.length}`);

  const [date, amount, currency, category, status] = fields;

  // Row 1: equal widths
  assert(
    Math.abs(date.width - amount.width) <= 2 && Math.abs(amount.width - currency.width) <= 2,
    `Row 1 widths unequal: date=${date.width}, amount=${amount.width}, currency=${currency.width}`
  );

  // Row 2: category under date, status under amount (same left edges within 2px)
  assert(
    Math.abs(date.left - category.left) <= 2,
    `Category not under Date: date.left=${date.left}, category.left=${category.left}`
  );
  assert(
    Math.abs(amount.left - status.left) <= 2,
    `Status not under Amount: amount.left=${amount.left}, status.left=${status.left}`
  );

  // Category same width as date
  assert(
    Math.abs(date.width - category.width) <= 2,
    `Category width ${category.width} != Date width ${date.width}`
  );

  const saveDisabled = await page.locator('[role=dialog] button[type=submit]').isDisabled();
  assert(saveDisabled, 'Save should be disabled when amount/description empty');

  const amountVal = await page.locator('#txn-amount').inputValue();
  assert(amountVal === '', `Amount should be empty, got "${amountVal}"`);

  const footerJustify = await page
    .locator('[role=dialog] .rounded-b-2xl')
    .evaluate((el) => getComputedStyle(el).justifyContent);
  assert(footerJustify === 'space-between', `Footer should be space-between, got ${footerJustify}`);

  const layering = await page.evaluate(() => {
    const dialog = document.querySelector('#modal-root [role=dialog]');
    const header = document.querySelector('header');
    const title = document.getElementById('add-transaction-title');
    if (!dialog || !header || !title) return { ok: false, reason: 'missing elements' };
    const dialogZ = Number.parseInt(getComputedStyle(dialog).zIndex, 10);
    const headerZ = Number.parseInt(getComputedStyle(header).zIndex, 10);
    const rect = title.getBoundingClientRect();
    const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const titleOnTop = title.contains(topEl);
    return {
      ok: dialog.closest('#modal-root') !== null && dialogZ > headerZ && titleOnTop,
      dialogZ,
      headerZ,
      titleOnTop,
    };
  });
  assert(
    layering.ok,
    `Modal should render above header: ${JSON.stringify(layering)}`
  );

  await page.screenshot({
    path: `.playwright-cli/modal-verify-${locale}.png`,
    scale: 'css',
  });

  if (locale === 'en') {
    await page.getByRole('button', { name: /Cancel/ }).click();
  } else {
    await page.getByRole('button', { name: /إلغاء/ }).click();
  }
  await page.waitForTimeout(300);

  return { locale, fields: fields.map((f) => ({ label: f.label, width: f.width })) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  try {
    await login(page);
    const en = await verifyLocale(page, 'en');
    const ar = await verifyLocale(page, 'ar');
    console.log('PASS: Add Transaction modal layout verified');
    console.log(JSON.stringify({ en, ar }, null, 2));
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
