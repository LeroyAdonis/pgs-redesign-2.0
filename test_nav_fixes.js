/**
 * Fix-up: Re-capture avatar dropdown (viewport screenshot) and click page 2 for pagination
 */
const { chromium } = require('playwright');

const FILE_URL = 'file:///C:/scratchpad/pgs-redesign-2.0/.worktrees/ds-components/ds-s04-nav.html';
const VIEWPORT = { width: 1400, height: 900 };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  await page.goto(FILE_URL);
  await page.waitForLoadState('networkidle');
  await sleep(1000);

  // ── Fix Step 3: Avatar dropdown with VIEWPORT screenshot ──
  console.log('=== FIX STEP 3: Avatar dropdown (viewport screenshot) ===');

  // Scroll navbar into view
  await page.locator('#navbar').scrollIntoViewIfNeeded();
  await sleep(300);

  // Click TM avatar
  const avatar = page.locator('.nav-bar__avatar').first();
  await avatar.click();
  await sleep(600);

  // Verify dropdown opened
  const isOpen = await page.locator('.nav-bar__user.is-open').first().isVisible();
  console.log('  Dropdown is-open:', isOpen);

  // Check if dropdown element is visible
  const dropdownEl = page.locator('#userDropdown1 .nav-bar__dropdown');
  const dropdownVisible = await dropdownEl.isVisible();
  console.log('  Dropdown element visible:', dropdownVisible);

  // Take VIEWPORT screenshot (not full-page) — captures the visible area
  await page.screenshot({ path: '/tmp/ds-nav-03-avatar-dropdown.png', fullPage: false });
  console.log('  Viewport screenshot saved: /tmp/ds-nav-03-avatar-dropdown.png');

  // Also try a clipped screenshot near the avatar
  const navbarBox = await page.locator('.nav-bar').first().boundingBox();
  if (navbarBox) {
    console.log('  Navbar bounding box:', JSON.stringify(navbarBox));
    // Expand clip area to catch the dropdown below the navbar
    await page.screenshot({
      path: '/tmp/ds-nav-03b-avatar-closeup.png',
      clip: {
        x: Math.max(0, navbarBox.x + navbarBox.width - 400),
        y: navbarBox.y,
        width: 400,
        height: 350
      }
    });
    console.log('  Closeup screenshot saved: /tmp/ds-nav-03b-avatar-closeup.png');
  }

  // Close dropdown
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  await sleep(300);

  // ── Fix Step 5: Click page 2 instead (page 3 was already active) ──
  console.log('\n=== FIX STEP 5: Pagination → page 2 ===');

  await page.locator('#pagination').scrollIntoViewIfNeeded();
  await sleep(500);

  const activePageBefore = (await page.locator('#paginationDemo .pagination__btn.is-active').textContent()).trim();
  console.log('  Active page before:', activePageBefore);

  // Click page 2
  const pageButtons = await page.locator('#paginationDemo .pagination__btn').all();
  for (const btn of pageButtons) {
    const txt = (await btn.textContent()).trim();
    if (txt === '2') {
      await btn.click();
      console.log('  Clicked page: 2');
      break;
    }
  }
  await sleep(500);

  const activePageAfter = (await page.locator('#paginationDemo .pagination__btn.is-active').textContent()).trim();
  console.log('  Active page after:', activePageAfter);

  // Check compact pagination text updated
  const compactTexts = await page.locator('.pagination-compact__text').allTextContents();
  console.log('  Compact pagination texts:', compactTexts.map(t => t.trim()));

  await page.screenshot({ path: '/tmp/ds-nav-05-pagination.png', fullPage: false });
  console.log('  Viewport screenshot saved: /tmp/ds-nav-05-pagination.png');

  console.log('\n=== FIXES COMPLETE ===');
  await browser.close();
})();
