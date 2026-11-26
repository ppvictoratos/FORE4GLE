# FORE4GLE ⛳

Minimalist top-down mini golf in a single HTML file. No build, no dependencies — just Canvas 2D.

**Play it:** https://fore4gle.vercel.app

> This was supposed to be an iOS app but HTML works for now. More interested in getting the hole design down. Starting with scaffolding, and then I will use Superpowers to generate a better plan of attack here. Also, I only have one whole drawn in my notebook so once I build that one... I need to draw 8 more lol. Gotta get to work!

<img width="1716" height="1530" alt="CleanShot 2026-06-26 at 22 56 26@2x" src="https://github.com/user-attachments/assets/755ca5aa-ea94-45e3-9c16-8a42905bb95d" />

## How to play

Drag back from the ball and release — slingshot style. The further you pull, the harder the shot (power bar caps out red).

The course is 18 holes, each with a par. Sink the ball, click, and you're on the next one. Finish all 18 for your total against par.

**Hole 1:** Start in the arch pocket. The right channel has three sloped basins: the two grey ones are traps — no penalty, but you'll have to putt hard enough to climb back out. The blue one holds the cup. Carry enough speed to escape the traps, but not so much you fly past the hole.

## Run locally

```bash
open index.html
```

That's it.

## Development

- Everything lives in `index.html` — physics, rendering, input, course data
- Walls are polylines (curves sampled into segments) with circle-vs-segment collision
- Funnels are radial gravity wells; traps auto-settle the ball after 2s
- Feel knobs: `maxPower`, wall restitution (`0.8` in `collideSegments`), funnel `pull`, cup sink-speed threshold

Deploy: `vercel --prod`
