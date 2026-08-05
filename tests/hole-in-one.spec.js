// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const GAME_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

/**
 * The point of this suite: you can stress gameplay through the real UI.
 * We search the game's own physics for a hole-in-one shot (headless
 * simulation, no rendering), then PROVE it by executing that exact shot
 * with genuine mouse events — mousedown, drag, mouseup — and asserting
 * the cup swallows the ball on stroke 1.
 */

/** Search angle/power space using the page's own updatePhysics(). */
async function findHoleInOne(page) {
  return page.evaluate(() => {
    const saved = JSON.stringify(game.ball);
    const savedStrokes = game.strokes;
    let winner = null;

    outer:
    for (let deg = 0; deg < 360; deg += 2) {
      for (let power = 6; power <= game.maxPower; power += 2) {
        // reset to tee
        Object.assign(game.ball, JSON.parse(saved), { x: TEE.x, y: TEE.y });
        game.ballInHole = false;
        game.funnelEnter = null;
        const a = deg * Math.PI / 180;
        game.ball.vx = Math.cos(a) * power;
        game.ball.vy = Math.sin(a) * power;

        for (let f = 0; f < 2000 && !game.ballInHole; f++) {
          updatePhysics();
          if (game.ball.vx === 0 && game.ball.vy === 0 && f > 50) break;
        }
        if (game.ballInHole) {
          winner = { deg, power };
          break outer;
        }
      }
    }

    // restore pristine state
    Object.assign(game.ball, JSON.parse(saved), { x: TEE.x, y: TEE.y, vx: 0, vy: 0 });
    game.ballInHole = false;
    game.funnelEnter = null;
    game.strokes = savedStrokes;
    return winner;
  });
}

/** Execute a shot through the UI: slingshot drag opposite the firing angle. */
async function shootViaMouse(page, deg, power) {
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  const scaleX = box.width / 800;
  const scaleY = box.height / 600;

  const ball = await page.evaluate(() => ({ x: game.ball.x, y: game.ball.y }));
  const a = deg * Math.PI / 180;
  // slingshot: drag point is opposite the firing direction, dist = power * 10
  const drag = {
    x: ball.x - Math.cos(a) * power * 10,
    y: ball.y - Math.sin(a) * power * 10
  };

  const toPage = (p) => ({ x: box.x + p.x * scaleX, y: box.y + p.y * scaleY });
  const start = toPage(ball);
  const end = toPage(drag);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
}

test.describe('FORE4GLE hole in one', () => {
  test('a hole-in-one line exists and works through the real UI', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('#gameCanvas')).toBeVisible();

    const winner = await findHoleInOne(page);
    expect(winner, 'physics search should find at least one hole-in-one shot').not.toBeNull();
    console.log(`hole-in-one found: ${winner.deg}° at power ${winner.power}`);

    await shootViaMouse(page, winner.deg, winner.power);

    // stroke registered immediately
    await expect(page.locator('#strokes')).toHaveText('1');

    // ball rolls, banks, and drops — real time, real frames
    await page.waitForFunction(() => game.ballInHole, null, { timeout: 30_000 });

    const strokes = await page.evaluate(() => game.strokes);
    expect(strokes).toBe(1);
  });

  test('grey traps hold a weak ball and release a firm putt', async ({ page }) => {
    await page.goto(GAME_URL);

    // drop the ball into the bottom trap and let it settle
    await page.evaluate(() => {
      game.ball.x = 611; game.ball.y = 400;
      game.ball.vx = 0; game.ball.vy = 2;
    });
    await page.waitForFunction(
      () => game.ball.vx === 0 && game.ball.vy === 0,
      null, { timeout: 10_000 }
    );
    const settled = await page.evaluate(() => ({ x: game.ball.x, y: game.ball.y }));
    expect(settled).toEqual({ x: 611, y: 445 }); // snapped to trap center

    // weak putt straight up: must get sucked back in
    await shootViaMouse(page, 270, 4);
    await page.waitForFunction(
      () => game.ball.vx === 0 && game.ball.vy === 0,
      null, { timeout: 15_000 }
    );
    const afterWeak = await page.evaluate(() => ({ x: game.ball.x, y: game.ball.y }));
    expect(afterWeak.y).toBeGreaterThan(370); // still in / near the trap

    // firm putt straight up: escapes the trap (and may well drop in the cup)
    await shootViaMouse(page, 270, 12);
    await page.waitForFunction(
      () => game.ballInHole || (game.ball.y < 370 && Math.hypot(game.ball.vx, game.ball.vy) < 0.5)
         || game.ballInHole,
      null, { timeout: 15_000 }
    );
    const escaped = await page.evaluate(() => game.ballInHole || game.ball.y < 370);
    expect(escaped).toBe(true);
  });
});
