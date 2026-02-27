"""
DS Navigation Components - Interactive Testing Script
Tests: theme toggle, avatar dropdown, underline tabs, pagination
"""
from playwright.sync_api import sync_playwright
import time

FILE_URL = "file:///C:/scratchpad/pgs-redesign-2.0/.worktrees/ds-components/ds-s04-nav.html"
VIEWPORT = {"width": 1400, "height": 900}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport=VIEWPORT)

    # ── Step 1: Full page screenshot (dark mode default) ──
    print("=== STEP 1: Full page screenshot (dark mode) ===")
    page.goto(FILE_URL)
    page.wait_for_load_state("networkidle")
    time.sleep(1)

    # Report page structure
    theme = page.get_attribute("html", "data-theme")
    print(f"  Theme: {theme}")

    # Check sidebar
    sidebar = page.locator(".ds-sidebar")
    sidebar_visible = sidebar.is_visible()
    print(f"  Sidebar visible: {sidebar_visible}")

    # Count sections
    sections = page.locator("main section").count()
    print(f"  Sections found: {sections}")

    # Section titles
    headings = page.locator(".ds-section__title").all_text_contents()
    print(f"  Section titles: {headings}")

    page.screenshot(path="/tmp/ds-nav-01-fullpage.png", full_page=True)
    print("  Screenshot saved: /tmp/ds-nav-01-fullpage.png")

    # ── Step 2: Click theme toggle to light mode ──
    print("\n=== STEP 2: Theme toggle → light mode ===")
    toggle = page.locator("#themeToggle")
    toggle_text_before = toggle.text_content()
    print(f"  Toggle icon before click: '{toggle_text_before.strip()}'")

    toggle.click()
    time.sleep(0.8)  # transition time

    theme_after = page.get_attribute("html", "data-theme")
    toggle_text_after = toggle.text_content()
    print(f"  Theme after click: {theme_after}")
    print(f"  Toggle icon after click: '{toggle_text_after.strip()}'")

    page.screenshot(path="/tmp/ds-nav-02-lightmode.png", full_page=True)
    print("  Screenshot saved: /tmp/ds-nav-02-lightmode.png")

    # ── Step 3: Click TM avatar dropdown ──
    print("\n=== STEP 3: TM avatar dropdown ===")
    # Switch back to dark mode first
    toggle.click()
    time.sleep(0.5)
    theme_back = page.get_attribute("html", "data-theme")
    print(f"  Switched back to: {theme_back}")

    # Scroll to the navbar section first
    page.locator("#navbar").scroll_into_view_if_needed()
    time.sleep(0.3)

    # Click the TM avatar
    avatar = page.locator(".nav-bar__avatar").first
    avatar_text = avatar.text_content()
    print(f"  Avatar text: '{avatar_text.strip()}'")
    avatar.click()
    time.sleep(0.5)

    # Check dropdown is open
    dropdown_open = page.locator(".nav-bar__user.is-open").first.is_visible()
    print(f"  Dropdown open: {dropdown_open}")

    # Read dropdown contents
    dropdown = page.locator("#userDropdown1 .nav-bar__dropdown")
    dropdown_name = dropdown.locator(".nav-bar__dropdown-name").text_content()
    dropdown_email = dropdown.locator(".nav-bar__dropdown-email").text_content()
    dropdown_items = dropdown.locator(".nav-bar__dropdown-item").all_text_contents()
    print(f"  User name: {dropdown_name.strip()}")
    print(f"  User email: {dropdown_email.strip()}")
    print(f"  Menu items: {[i.strip() for i in dropdown_items]}")

    page.screenshot(path="/tmp/ds-nav-03-avatar-dropdown.png", full_page=True)
    print("  Screenshot saved: /tmp/ds-nav-03-avatar-dropdown.png")

    # Close the dropdown by clicking elsewhere
    page.locator("body").click(position={"x": 10, "y": 10})
    time.sleep(0.3)

    # ── Step 4: Click Drafts tab ──
    print("\n=== STEP 4: Underline tabs → Drafts ===")
    # Scroll to tabs section
    page.locator("#tabs").scroll_into_view_if_needed()
    time.sleep(0.5)

    # Check which tab is currently active
    active_tab_before = page.locator('.tabs-underline[data-tabgroup="underline"] .tabs-underline__item.is-active').text_content()
    print(f"  Active tab before: '{active_tab_before.strip()}'")

    # Click Drafts tab
    drafts_tab = page.locator('[data-tabgroup="underline"] [data-tab="drafts"]')
    drafts_tab.click()
    time.sleep(0.5)

    # Check active tab changed
    active_tab_after = page.locator('.tabs-underline[data-tabgroup="underline"] .tabs-underline__item.is-active').text_content()
    print(f"  Active tab after: '{active_tab_after.strip()}'")

    # Read the drafts panel content
    drafts_panel = page.locator('[data-tabgroup="underline"][data-panel="drafts"]')
    drafts_visible = drafts_panel.is_visible()
    drafts_content = drafts_panel.text_content()
    print(f"  Drafts panel visible: {drafts_visible}")
    print(f"  Drafts panel content: '{drafts_content.strip()[:120]}...'")

    page.screenshot(path="/tmp/ds-nav-04-drafts-tab.png", full_page=True)
    print("  Screenshot saved: /tmp/ds-nav-04-drafts-tab.png")

    # ── Step 5: Click pagination number ──
    print("\n=== STEP 5: Pagination click ===")
    # Scroll to pagination section
    page.locator("#pagination").scroll_into_view_if_needed()
    time.sleep(0.5)

    # Find the active page before click
    active_page_before = page.locator("#paginationDemo .pagination__btn.is-active").text_content()
    print(f"  Active page before: '{active_page_before.strip()}'")

    # Click page 3
    page_buttons = page.locator("#paginationDemo .pagination__btn").all()
    print(f"  Total pagination buttons: {len(page_buttons)}")
    for btn in page_buttons:
        txt = btn.text_content().strip()
        if txt == "3":
            btn.click()
            print(f"  Clicked page: 3")
            break
    time.sleep(0.5)

    # Check active page changed
    active_page_after = page.locator("#paginationDemo .pagination__btn.is-active").text_content()
    print(f"  Active page after: '{active_page_after.strip()}'")

    # Check compact pagination text
    compact_texts = page.locator(".pagination-compact__text").all_text_contents()
    print(f"  Compact pagination texts: {[t.strip() for t in compact_texts]}")

    page.screenshot(path="/tmp/ds-nav-05-pagination.png", full_page=True)
    print("  Screenshot saved: /tmp/ds-nav-05-pagination.png")

    print("\n=== ALL STEPS COMPLETE ===")
    browser.close()
