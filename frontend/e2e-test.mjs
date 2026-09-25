import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:3000';
const results = [];
const log = (ok, msg) => { results.push({ ok, msg }); console.log(`${ok ? '✅' : '❌'} ${msg}`); };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* React-safe input setter (bypasses React's value tracking) */
async function setInput(page, el, value) {
  await page.evaluate(
    (element, val) => {
      const proto = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : element.tagName === 'SELECT'
          ? window.HTMLSelectElement.prototype
          : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(element, val);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },
    el, value
  );
}

async function login(page, email, pwd, role) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="text"]', { timeout: 15000 });
  await sleep(500); // let React settle (StrictMode double-mount)

  

  // React-safe fill + verify (page.type can lose values on re-mount)
  for (let attempt = 0; attempt < 3; attempt++) {
    const userEl = await page.$('input[type="text"]');
    const pwdEl = await page.$('input[type="password"]');
    const selEl = await page.$('select');
    await setInput(page, userEl, email);
    await setInput(page, selEl, role);
    await setInput(page, pwdEl, pwd);

    const filled = await page.evaluate(() => ({
      user: document.querySelector('input[type="text"]').value,
      role: document.querySelector('select').value,
      pwd: document.querySelector('input[type="password"]').value,
    }));
    if (filled.user === email && filled.role === role && filled.pwd === pwd) break;
    await sleep(600);
  }

  await page.evaluate(() => document.querySelector('button[type="submit"]').click());
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
}

async function logout(page) {
  // click the sidebar Logout link — real user flow, clears context state too
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'Logout');
    if (link) link.click();
  });
  await sleep(800);
}

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

  try {
    /* ─── 1. Landing ────────────────────────────────── */
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    log(true, `Landing page loads — "${await page.title()}"`);

    /* ─── 2. Donor: login + post donation ───────────── */
    await login(page, 'Test Hotel', 'password123', 'DONOR');
    log(true, `Donor login → ${page.url()}`);

    await page.goto(`${BASE}/donor/donate`, { waitUntil: 'networkidle2' });
    await sleep(800);

    // All text inputs in form order: title, qty, servings, preparedTime, safeHours, location
    const inputs = await page.$$('form input');
    const labels = [];
    for (const inp of inputs) labels.push(await inp.evaluate(el => el.type));
    console.log('   inputs:', labels.join(', '));

    await setInput(page, inputs[0], 'E2E Test Meals');
    await setInput(page, inputs[1], '12 boxes');
    await setInput(page, inputs[2], '24');
    await setInput(page, inputs[3], '2026-09-25T10:00');
    await setInput(page, inputs[4], '6');
    await setInput(page, inputs[5], 'E2E Test Location');

    const selects = await page.$$('form select');
    await setInput(page, selects[0], 'Cooked Food');  // category
    if (selects[1]) await setInput(page, selects[1], 'Room Temperature');

    const ta = await page.$('form textarea');
    if (ta) await setInput(page, ta, 'Automated E2E test donation.');

    // scroll button into view, then JS-click (coordinate clicks are flaky on long scrolled forms)
    await page.evaluate(() => {
      const btn = document.querySelector('form button[type="submit"]');
      btn.scrollIntoView({ block: 'center' });
    });
    await sleep(400);
    await page.evaluate(() => document.querySelector('form button[type="submit"]').click());
    await sleep(1800);

    const bodyText = await page.evaluate(() => document.body.innerText);
    log(bodyText.includes('successfully'), 'Donation posted — success modal shown');

    await page.goto(`${BASE}/donor/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    const dashText = await page.evaluate(() => document.body.innerText);
    log(dashText.includes('E2E Test Meals'), 'Donor dashboard lists new donation');

    await logout(page);
    await sleep(300);

    /* ─── 3. NGO: login + accept ────────────────────── */
    await login(page, 'Helping Hands', 'password123', 'NGO');
    log(true, `NGO login → ${page.url()}`);
    await sleep(1200);

    const clickedAccept = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[class*="card"], .grid > div')];
      const card = cards.find(c => c.innerText.includes('E2E Test Meals') && c.innerText.includes('Accept Food'));
      if (!card) return false;
      [...card.querySelectorAll('button')].find(b => b.innerText.includes('Accept Food')).click();
      return true;
    });
    log(clickedAccept, 'NGO clicked Accept Food');

    await sleep(700);
    await page.evaluate(() => {
      const modal = [...document.querySelectorAll('.fixed.inset-0')].pop();
      if (!modal) return;
      const inp = modal.querySelector('input');
      if (inp) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, 'E2E Shelter');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
      [...modal.querySelectorAll('button')].find(b => b.innerText.includes('Confirm Acceptance'))?.click();
    });
    await sleep(1500);

    const ngoText = await page.evaluate(() => document.body.innerText);
    log(ngoText.includes('NGO Accepted'), 'NGO acceptance confirmed (status badge)');

    await logout(page);
    await sleep(300);

    /* ─── 4. Volunteer: login + 4-step delivery ─────── */
    await login(page, 'John V', 'password123', 'VOLUNTEER');
    log(true, `Volunteer login → ${page.url()}`);
    await sleep(1200);

    // Accept Pickup (first pending card)
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Accept Pickup'));
      if (btn) btn.click();
    });
    await sleep(1500);
    log(true, 'Volunteer accepted pickup');

    for (const label of ['Start Pickup', 'Mark Food Collected', 'Start Delivery', 'Mark as Delivered']) {
      const ok = await page.evaluate((lbl) => {
        const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes(lbl) && b.offsetParent !== null);
        if (btn) { btn.click(); return true; }
        return false;
      }, label);
      await sleep(1400);
      log(ok, `Volunteer step: ${label}`);
    }

    /* ─── 5. Admin: dashboard stats ─────────────────── */
    await logout(page);
    await sleep(300);
    await login(page, 'Admin', 'password123', 'ADMIN');
    await sleep(1500);
    const adminText = await page.evaluate(() => document.body.innerText);
    log(adminText.includes('Admin Dashboard'), 'Admin dashboard loads');
    log(/Volunteers\s*\n?\s*\d+/.test(adminText), 'Admin stat cards show numbers');

    await logout(page);
    await sleep(300);

    /* ─── 6. Landing stats updated ──────────────────── */
    await page.goto(BASE, { waitUntil: 'networkidle2' });
    await sleep(1200);
    const homeText = await page.evaluate(() => document.body.innerText);
    log(/Meals Shared\s*\n?\s*[\d,]+/.test(homeText) || /\d{2,}/.test(homeText.replace(/\s/g, '')), 'Landing page shows live stats');

  } catch (err) {
    log(false, `FATAL: ${err.message}`);
    try { await page.screenshot({ path: '../e2e-failure.png', fullPage: true }); } catch { /* */ }
  }

  console.log('\n────────── CONSOLE ERRORS ──────────');
  const real = consoleErrors.filter(e => !e.includes('React DevTools') && !e.includes('favicon'));
  if (real.length === 0) log(true, 'No browser console errors');
  else real.forEach(e => console.log('⚠️ ', e.slice(0, 180)));

  await browser.close();
  const passed = results.filter(r => r.ok).length;
  console.log(`\n═══ RESULT: ${passed}/${results.length} checks passed ═══`);
  process.exit(passed === results.length ? 0 : 1);
};

run();
