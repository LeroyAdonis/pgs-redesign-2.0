/**
 * Final fix: Capture the avatar dropdown by locating its exact rendered position
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
  await sleep(800);

  // Scroll so navbar is near top of viewport
  await page.evaluate(() => {
    const el = document.querySelector('#navbar');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await sleep(500);

  // Click the TM avatar
  const avatar = page.locator('.nav-bar__avatar').first();
  await avatar.click();
  await sleep(600);

  // Debug: get computed styles and bounding boxes
  const debugInfo = await page.evaluate(() => {
    const userWrapper = document.querySelector('#userDropdown1');
    const dropdown = document.querySelector('#userDropdown1 .nav-bar__dropdown');
    const avatar = document.querySelector('.nav-bar__avatar');
    
    const getInfo = (el, name) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        name,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        overflow: style.overflow,
        position: style.position,
        zIndex: style.zIndex,
        classes: el.className
      };
    };
    
    // Also check parent overflow
    const navBar = document.querySelector('.nav-bar');
    const demoCard = navBar ? navBar.closest('.ds-demo-card, .ds-section__demo') : null;
    
    return {
      userWrapper: getInfo(userWrapper, 'userWrapper'),
      dropdown: getInfo(dropdown, 'dropdown'),
      avatar: getInfo(avatar, 'avatar'),
      navBar: getInfo(navBar, 'navBar'),
      demoCard: demoCard ? getInfo(demoCard, 'demoCard') : null
    };
  });

  console.log('=== DEBUG: Element positions & styles ===');
  for (const [key, info] of Object.entries(debugInfo)) {
    if (!info) continue;
    console.log(`\n  ${key}:`);
    console.log(`    rect: x=${info.rect?.x}, y=${info.rect?.y}, w=${info.rect?.w}, h=${info.rect?.h}`);
    console.log(`    display=${info.display}, visibility=${info.visibility}, opacity=${info.opacity}`);
    console.log(`    overflow=${info.overflow}, position=${info.position}, zIndex=${info.zIndex}`);
    console.log(`    classes: ${info.classes}`);
  }

  // Force remove overflow hidden on parent containers to allow dropdown to show
  await page.evaluate(() => {
    const dropdown = document.querySelector('#userDropdown1 .nav-bar__dropdown');
    if (!dropdown) return;
    
    // Walk up parents and remove overflow: hidden
    let el = dropdown.parentElement;
    while (el && el !== document.body) {
      const style = getComputedStyle(el);
      if (style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowX === 'hidden') {
        console.log('Removing overflow:hidden from', el.className || el.tagName);
        el.style.overflow = 'visible';
      }
      el = el.parentElement;
    }
  });
  await sleep(300);

  // Now take a viewport screenshot
  await page.screenshot({ path: '/tmp/ds-nav-03-avatar-dropdown.png', fullPage: false });
  console.log('\n  Viewport screenshot saved');

  // Also take element screenshot of the dropdown itself
  const dropdownEl = page.locator('#userDropdown1 .nav-bar__dropdown');
  const dropdownBox = await dropdownEl.boundingBox();
  console.log('  Dropdown boundingBox:', JSON.stringify(dropdownBox));
  
  if (dropdownBox && dropdownBox.width > 0 && dropdownBox.height > 0) {
    await dropdownEl.screenshot({ path: '/tmp/ds-nav-03c-dropdown-element.png' });
    console.log('  Element screenshot saved: /tmp/ds-nav-03c-dropdown-element.png');
  } else {
    console.log('  Dropdown has zero size — trying to screenshot the user wrapper instead');
    const wrapper = page.locator('#userDropdown1');
    await wrapper.screenshot({ path: '/tmp/ds-nav-03c-dropdown-element.png' });
    console.log('  Wrapper screenshot saved');
  }

  console.log('\n=== DONE ===');
  await browser.close();
})();
