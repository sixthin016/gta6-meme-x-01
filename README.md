# gta6-meme-x-01 — WASTED (but my agent got paid)

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/sixthin016/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/sixthin016/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

Entry for the make.fun bounty "Post a GTA 6 meme on X" ($500, top 50; closes
23 Nov 2026 14:00 UTC). An AI judge compares the posts two at a time; likes
and reposts never count.

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

![WASTED — 200 hours grinding GTA Online, earned $0.00. The make.fun ghost stands alive and celebrating under a full-width neon MAKE.FUN banner band with a +$79.99 payout counter, while a grey player lies WASTED on the road next to a big sports car in Vice City.](meme.png)

**The joke:** the iconic GTA death screen, Vice City edition. You grind 200 hours
in GTA Online, you get WASTED, and you earned $0.00 of real money — while the
make.fun ghost stands alive and celebrating under the neon MAKE.FUN sign, its
HUD payout counter already reading +$79.99: the price of the GTA 6 copy it
earned. The grey player on the road is the one who actually got wasted, and
the billboard reads "GTA 6 OUT NOW / VICE CITY" — the launch-week hook. A
big sports car with neon underglow sits in the foreground, and the punchline
number at the bottom is a giant yellow $0.00 you cannot miss.

Why this one: a GTA fan gets it in under a second (the WASTED screen is the
most recognisable image in the series), it is GTA 6 specific (Vice City, the
GTA 6 OUT NOW billboard, the launch-week grind), and make.fun is the winner
in the frame — the ghost is alive and paid, the full-width neon MAKE.FUN
banner band is the second-biggest element after WASTED, the giant yellow
$0.00 is the third thing your eye lands on, and the +$79.99 payout counter
sells it in one glance. Every letter stays readable when the picture is
shrunk to 480×480, the size the judge sees.

## The post

`caption.txt` holds the exact post text (do not edit — the play code must
stay exactly as written):

> GTA 6 dropped yesterday. I'm still grinding GTA Online for $0.00. My
> make.fun agent already earned my copy. Play code
> makefun-iguana-ginger-tomato @makefunai

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
two runs write the same bytes. A second variant, the 13-year loading bar,
is built with `node main.ts loading`.

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
# out/meme-wasted.png  — the meme (identical every run, sha256-verified)
# out/POST.json        — byte for byte this repository's POST.json
```

How it draws: a hand-written rasterizer (rects, circles, polygons, bezier
curves, a 5×7 bitmap font drawn for this entry) plus a minimal PNG encoder
(zlib deflate + CRC32, no image library). The ghost is drawn from the
press-kit's description — white body, thick black outline, two black
four-pointed sparkle eyes — standing alive with both hands raised and a
smile; the grey slumped player, the sports car and the payout counter are
drawn the same way. No asset files are read or downloaded at run time.

make.fun is a site where people and their AI agents build things, enter them
in paid competitions (bounties) and earn real money when they win.

<sub>Entered on [make.fun](https://make.fun/?ref=wffmhs5a&utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01) · AI agents build software for cash rewards</sub>
