import { expect, test, type Page } from '@playwright/test';

async function setCode(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await page.keyboard.insertText(code);
}

async function setSpeed(page: Page, level: number): Promise<void> {
  await page.locator('#speed-control input').fill(String(level));
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.goto('/');
});

test('first visit shows a skippable tour', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: 'Welcome, operator' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.locator('.tour')).toHaveCount(0);
});

test('play mission 1, persist progress, and debug mission 2', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await setSpeed(page, 6);

  await page.getByRole('button', { name: /^Run/ }).click();
  await expect(page.locator('.banner')).toContainText('Not quite');

  await setCode(page, 'for (let i = 0; i < 5; i++) {\n  move("east");\n}\n');
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(page.locator('.banner')).toContainText('Mission complete');
  await expect(page.locator('.topbar__bank')).toContainText('5');

  await page.getByRole('button', { name: 'Next mission' }).click();
  await expect(page.locator('.pane h2')).toHaveText('First Harvest');

  await setCode(page, 'getPosX();\nconsole.log(`pos ${getPosX()},${getPosY()}`, [1, "a"]);\nconsole.warn("careful");\n');
  await page.getByRole('button', { name: /^Run/ }).click();
  const log = page.locator('.console__log');
  await expect(log).toContainText("pos 0,0 [ 1, 'a' ]");
  await expect(log).toContainText('nothing used the result');
  await expect(log).toContainText('careful');

  await setCode(page, 'move("north")\nif (');
  await page.getByRole('button', { name: /^Run/ }).click();
  await expect(log).toContainText('Syntax error');
  await expect(page.locator('.cm-error-line')).toHaveCount(1);

  await setCode(page, 'print(1);');
  await page.getByRole('button', { name: /^Run/ }).click();
  await expect(log).toContainText('console.log');

  await page.reload();
  await expect(page.locator('.tour')).toHaveCount(0);
  await expect(page.locator('.topbar__level')).toContainText('First Harvest');
  await expect(page.locator('.cm-content')).toContainText('print(1);');
  await page.getByRole('tab', { name: 'Levels' }).click();
  await expect(page.locator('.level--done')).toHaveCount(1);
});

test('run controls: pause, resume, step and stop keep the page responsive', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await setSpeed(page, 3);
  await setCode(page, 'while (true) { move("east"); move("west"); }');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.status')).toHaveAttribute('data-status', 'running');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.locator('.status')).toHaveAttribute('data-status', 'paused');
  const tick = await page.locator('.stage__runbar').innerText();
  await page.waitForTimeout(300);
  expect(await page.locator('.stage__runbar').innerText()).toBe(tick);
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.locator('.status')).toHaveAttribute('data-status', 'stopped');

  await page.getByRole('button', { name: 'Reset field' }).click();
  await setCode(page, 'move("east");\nmove("east");');
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(page.locator('.cm-executing-line')).toContainText('move("east");');
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(page.locator('.stage__runbar')).toContainText('x 1, y 0');
});

test('autocomplete suggests game functions and console members', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip tour' }).click();
  const selected = page.locator('.cm-tooltip-autocomplete li[aria-selected="true"]');
  await setCode(page, '');
  await page.keyboard.type('console.l');
  await expect(selected).toContainText('log');
  await page.waitForTimeout(150); // CodeMirror ignores Enter for a moment after the list opens (interactionDelay)
  await page.keyboard.press('Enter');
  await expect(page.locator('.cm-content')).toHaveText('console.log()');

  await setCode(page, '');
  await page.keyboard.type('mo');
  await expect(selected).toContainText('move');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await expect(page.locator('.cm-content')).toHaveText('move()');
});
