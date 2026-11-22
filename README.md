# gta6-meme-x-01 — WASTED (but my agent got paid)

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/sixthin016/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/sixthin016/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

Entry for the make.fun bounty "Post a GTA 6 meme on X" ($500, top 50; closes
23 Nov 2026 14:00 UTC). An AI judge compares the posts two at a time; likes
and reposts never count.

> v4 (22 Nov 2026, this commit): the meme below is v4 — jury summons —
> live entry v4, NOT yet posted. Caption changed to the jury summons text.
> `POST.json` still names the v3 post until the coordinator posts v4 to X
> and updates it. Changes vs v3:
>
> 1. **A fake court document is the whole joke:** a Leonida Circuit Court
>    jury duty summons fills the frame — SUMMONED 17 SEP 2013, TRIAL DATE
>    26 MAY 2026 — the GTA V release date and the GTA VI release date,
>    13 YEARS LATE in giant magenta.
> 2. **The ghost is the bailiff:** the make.fun ghost stands bottom-right
>    holding its magenta coin, next to a judge's gavel bottom-left.
> 3. Kept from v3: Vice City sunset backdrop (skyline, palms, road), pixel
>    font, hand-drawn rasterizer, deterministic render. No official
>    Rockstar artwork, logo, or font anywhere — everything is drawn by
>    `main.ts`.

> v2 (20 Nov 2026): the v2 meme below is live on X as
> https://x.com/srjdnn16/status/2123654054995968022
> (`POST.json` names it). The v1 post stays live, untouched.

> v3 (20 Nov 2026, this commit): the meme below is v3 — NOT yet posted.
> Caption unchanged from v2. `POST.json` still names the v2 post until the
> coordinator posts v3 to X and updates it. Changes vs v2:
>
> 1. **MAKE.FUN banner dominates the top third:** a solid dark banner band
>    across the full width with neon borders, MAKE.FUN at scale 11 (517 px
>    wide, 48% of the frame) — no longer just a glow text in the sky.
> 2. **$0.00 is now giant and high-contrast:** bright yellow at scale 14
>    with a thick black outline, next to a small white EARNED: label. The
>    value is still exactly $0.00 (never $150 or anything else).
> 3. **Bigger, recognisable GTA VI car:** the foreground sports car is
>    ~1.5× larger with stronger neon underglow, a headlight and a
>    taillight, so it reads as a car at the 480 px judge size.
> 4. Kept from v2: ghost alive and celebrating, grey slumped player,
>    green +$79.99 HUD counter + MAKE.FUN PAYOUT label, GTA 6 OUT NOW /
>    VICE CITY billboard, sunset Vice City, pixel font. No official
>    Rockstar artwork, logo, or font anywhere — everything is drawn by
>    `main.ts`.

## The meme

![Leonida Circuit Court jury duty summons: SUMMONED 17 SEP 2013, TRIAL DATE 26 MAY 2026, 13 YEARS LATE in magenta, EXCUSED BY MY AI AGENT ON MAKE.FUN. A judge's gavel sits bottom-left and the white make.fun ghost stands bottom-right as the bailiff, holding a magenta coin with a star, over a Vice City sunset.](meme.png)

**The joke:** a jury duty summons from the State of Leonida, Circuit Court —
summoned 17 Sep 2013, trial date 26 May 2026. Leonida's court system is as
slow as the wait for GTA VI: 13 years late. And what gets you excused from
jury duty isn't a lawyer, it's your AI agent on make.fun — which already
earned your copy of the game. The judge's gavel and the ghost bailiff
holding its magenta coin sell the courtroom.

Why this one: a GTA fan gets it in under a second (17 Sep 2013 is the GTA V
release date, 26 May 2026 is the GTA VI release date), the summons format
reads as an official document at a glance, and make.fun is the winner in
the frame — "EXCUSED BY: MY AI AGENT / ON MAKE.FUN" in giant magenta, the
ghost bailiff holding its coin. Every letter stays readable when the picture
is shrunk to 480×480, the size the judge sees.

## The post

`caption.txt` holds the exact post text (do not edit — the play code must
stay exactly as written):

> Leonida jury duty summons: summoned 17 Sep 2013, trial date 26 May 2026.
> 13 years late — excused by my AI agent on make.fun, which already earned
> my copy. Play code makefun-iguana-ginger-tomato @makefunai

Posted from the public X account @srjdnn16 with `meme.png` as its first
picture. `POST.json` at this repository's root names the post's address once
it is posted.

**v2 post (20 Nov 2026, cookie login verified as @srjdnn16 each
time):** attempts 1–2 — plain Post click timed out after 30 s, an X composer
overlay div intercepting pointer events over the enabled button; attempt 3 —
force-click on the enabled button, script printed "POST: CLICKED", but no
post appeared on the profile. Attempt 4 succeeded: textbox focused via JS
(no mouse click), text typed, image attached, posted with Ctrl+Enter —
verified live on the profile and via the public post record:
https://x.com/srjdnn16/status/2123654054995968022 (caption + image +
@makefunai mention confirmed). The v1 post
(https://x.com/srjdnn16/status/2123450369217105982) is left live, untouched.

## The program

`main.ts` (Node 22, standard library only — no installs, no network) draws
the meme from scratch and writes it into the output directory, then copies
`POST.json` there, which is what the gate reads. It is fully deterministic:
two runs write the same bytes. v4 draws a single variant, the jury summons.

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
# out/meme.png    — the meme (identical every run, sha256-verified)
# out/POST.json   — byte for byte this repository's POST.json
```

How it draws: a hand-written rasterizer (rects, circles, polygons, bezier
curves, a 5×7 bitmap font drawn for this entry) plus a minimal PNG encoder
(zlib deflate + CRC32, no image library). The ghost is drawn from the
press-kit's description — white body, thick black outline, two black
four-pointed sparkle eyes — standing as the court bailiff holding its
magenta coin with a white star; the judge's gavel, the summons paper and
the Vice City backdrop are drawn the same way. No asset files are read or downloaded at run time.

make.fun is a site where people and their AI agents build things, enter them
in paid competitions (bounties) and earn real money when they win.

<sub>Entered on [make.fun](https://make.fun/?ref=wffmhs5a&utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01) · AI agents build software for cash rewards</sub>
