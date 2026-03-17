/**
 * DS Navigation Components – Interactive Testing Script (Node.js / Playwright)
 * Tests: theme toggle, avatar dropdown, underline tabs, pagination
 */
const { chromium } = require('playwright');

const FILE_URL = 'file:///C:/scratchpad/pgs-redesign-2.0/.worktrees/ds-components/ds-s04-nav.html';
const VIEWPORT = { width: 1400, height: 900 };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  // Helper: sleep
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── Step 1: Full page screenshot (dark mode default) ──────────────────
  console.log('=== STEP 1: Full page screenshot (dark mode) ===');
  await page.goto(FILE_URL);
  await page.waitForLoadState('networkidle');
  await sleep(1000);

  const theme = await page.getAttribute('html', 'data-theme');
  console.log('  Theme:', theme);

  const sidebarVisible = await page.locator('.ds-sidebar').isVisible();
  console.log('  Sidebar visible:', sidebarVisible);

  const sectionCount = await page.locator('main section').count();
  console.log('  Sections found:', sectionCount);

  const headings = await page.locator('.ds-section__title').allTextContents();
  console.log('  Section titles:', headings.map(h => h.trim()));

  await page.screenshot({ path: '/tmp/ds-nav-01-fullpage.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/ds-nav-01-fullpage.png');

  // ── Step 2: Click theme toggle to light mode ──────────────────────────
  console.log('\n=== STEP 2: Theme toggle → light mode ===');
  const toggle = page.locator('#themeToggle');
  const iconBefore = (await toggle.textContent()).trim();
  console.log('  Toggle icon before:', JSON.stringify(iconBefore));

  await toggle.click();
  await sleep(800);

  const themeAfter = await page.getAttribute('html', 'data-theme');
  const iconAfter = (await toggle.textContent()).trim();
  console.log('  Theme after click:', themeAfter);
  console.log('  Toggle icon after:', JSON.stringify(iconAfter));

  await page.screenshot({ path: '/tmp/ds-nav-02-lightmode.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/ds-nav-02-lightmode.png');

  // ── Step 3: Click TM avatar dropdown ──────────────────────────────────
  console.log('\n=== STEP 3: TM avatar dropdown ===');

  // Switch back to dark
  await toggle.click();
  await sleep(500);
  const themeBack = await page.getAttribute('html', 'data-theme');
  console.log('  Switched back to:', themeBack);

  // Scroll to navbar
  await page.locator('#navbar').scrollIntoViewIfNeeded();
  await sleep(300);

  // Click TM avatar
  const avatar = page.locator('.nav-bar__avatar').first();
  const avatarText = (await avatar.textContent()).trim();
  console.log('  Avatar text:', JSON.stringify(avatarText));
  await avatar.click();
  await sleep(500);

  // Check dropdown
  const dropdownOpen = await page.locator('.nav-bar__user.is-open').first().isVisible();
  console.log('  Dropdown open:', dropdownOpen);

  const dropdown = page.locator('#userDropdown1 .nav-bar__dropdown');
  const dropdownName = (await dropdown.locator('.nav-bar__dropdown-name').textContent()).trim();
  const dropdownEmail = (await dropdown.locator('.nav-bar__dropdown-email').textContent()).trim();
  const dropdownItems = await dropdown.locator('.nav-bar__dropdown-item').allTextContents();
  console.log('  User name:', dropdownName);
  console.log('  User email:', dropdownEmail);
  console.log('  Menu items:', dropdownItems.map(i => i.trim()));

  await page.screenshot({ path: '/tmp/ds-nav-03-avatar-dropdown.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/ds-nav-03-avatar-dropdown.png');

  // Close dropdown
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  await sleep(300);

  // ── Step 4: Click Drafts tab ──────────────────────────────────────────
  console.log('\n=== STEP 4: Underline tabs → Drafts ===');

  await page.locator('#tabs').scrollIntoViewIfNeeded();
  await sleep(500);

  const activeTabBefore = (await page.locator('.tabs-underline[data-tabgroup="underline"] .tabs-underline__item.is-active').textContent()).trim();
  console.log('  Active tab before:', JSON.stringify(activeTabBefore));

  const draftsTab = page.locator('[data-tabgroup="underline"] [data-tab="drafts"]');
  await draftsTab.click();
  await sleep(500);

  const activeTabAfter = (await page.locator('.tabs-underline[data-tabgroup="underline"] .tabs-underline__item.is-active').textContent()).trim();
  console.log('  Active tab after:', JSON.stringify(activeTabAfter));

  const draftsPanel = page.locator('[data-tabgroup="underline"][data-panel="drafts"]');
  const draftsVisible = await draftsPanel.isVisible();
  const draftsContent = (await draftsPanel.textContent()).trim();
  console.log('  Drafts panel visible:', draftsVisible);
  console.log('  Drafts panel content:', JSON.stringify(draftsContent.substring(0, 150)));

  await page.screenshot({ path: '/tmp/ds-nav-04-drafts-tab.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/ds-nav-04-drafts-tab.png');

  // ── Step 5: Click pagination number ───────────────────────────────────
  console.log('\n=== STEP 5: Pagination click ===');

  await page.locator('#pagination').scrollIntoViewIfNeeded();
  await sleep(500);

  const activePageBefore = (await page.locator('#paginationDemo .pagination__btn.is-active').textContent()).trim();
  console.log('  Active page before:', activePageBefore);

  const pageButtons = await page.locator('#paginationDemo .pagination__btn').all();
  console.log('  Total pagination buttons:', pageButtons.length);

  for (const btn of pageButtons) {
    const txt = (await btn.textContent()).trim();
    if (txt === '3') {
      await btn.click();
      console.log('  Clicked page: 3');
      break;
    }
  }
  await sleep(500);

  const activePageAfter = (await page.locator('#paginationDemo .pagination__btn.is-active').textContent()).trim();
  console.log('  Active page after:', activePageAfter);

  const compactTexts = await page.locator('.pagination-compact__text').allTextContents();
  console.log('  Compact pagination texts:', compactTexts.map(t => t.trim()));

  await page.screenshot({ path: '/tmp/ds-nav-05-pagination.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/ds-nav-05-pagination.png');

  console.log('\n=== ALL STEPS COMPLETE ===');
  await browser.close();
})();
