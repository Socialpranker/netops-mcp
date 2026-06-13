#!/usr/bin/env python3
"""Render the netops-mcp money-shot as an animated GIF (no external deps but Pillow).
Mirrors assets/demo.svg so README has a GIF fallback if GitHub's proxy flattens the SVG."""
from PIL import Image, ImageDraw, ImageFont

W, H = 680, 388
BG = "#0d1117"
WIN = "#0d1117"
BORDER = "#30363d"
SEP = "#21262d"
MUT = "#8b949e"
TXT = "#e6edf3"
CYAN = "#58a6ff"
GREEN = "#3fb950"
RED = "#f85149"
AMBER = "#d29922"
GREENP = "#7ee787"
BODY = "#c9d1d9"
VBG = "#161b22"

FP = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FPB = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
f15 = ImageFont.truetype(FP, 15)
f14 = ImageFont.truetype(FP, 14)
f12 = ImageFont.truetype(FP, 12)
f15b = ImageFont.truetype(FPB, 15)


def base():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([6, 6, 673, 377], radius=12, fill=WIN, outline=BORDER)
    for cx, col in [(28, "#ff5f56"), (46, "#febc2e"), (64, "#28c840")]:
        d.ellipse([cx - 5, 23, cx + 5, 33], fill=col)
    d.text((340, 28), "netops-mcp", font=f12, fill=MUT, anchor="ms")
    d.line([6, 50, 674, 50], fill=SEP)
    return img


def segs(d, x, baseline, parts):
    for text, color, font in parts:
        d.text((x, baseline), text, font=font, fill=color, anchor="ls")
        x += d.textlength(text, font=font)
    return x


PROMPT = "why can't I reach api.acme.dev?"
ROW1 = [("net_diagnose", CYAN, f14), ("   DNS ", MUT, f14), ("✓", GREEN, f14),
        ("  TCP ", MUT, f14), ("✗ timeout @10.0.0.5", RED, f14)]
ROW2 = [("net_triangulate", CYAN, f14), ("   you ", MUT, f14), ("✗", RED, f14),
        ("   US ", MUT, f14), ("✓", GREEN, f14), ("  EU ", MUT, f14), ("✓", GREEN, f14),
        ("  Asia ", MUT, f14), ("✓", GREEN, f14)]
ROW3 = [("config_correlate", CYAN, f14), ("  /etc/hosts:12  api.acme.dev → ", MUT, f14),
        ("10.0.0.5", AMBER, f14)]


def draw_state(typed_chars, rows, verdict, cursor=True):
    img = base()
    d = ImageDraw.Draw(img)
    x = segs(d, 24, 84, [(">", GREENP, f15)])
    shown = PROMPT[:typed_chars]
    ex = segs(d, 44, 84, [(shown, TXT, f15)])
    if cursor and typed_chars <= len(PROMPT):
        d.rectangle([ex + 1, 70, ex + 9, 88], fill=GREENP)
    if rows >= 1:
        segs(d, 24, 128, ROW1)
    if rows >= 2:
        segs(d, 24, 162, ROW2)
    if rows >= 3:
        segs(d, 24, 196, ROW3)
    if verdict:
        d.rounded_rectangle([24, 212, 656, 362], radius=10, fill=VBG, outline=BORDER)
        d.rectangle([24, 224, 28, 350], fill=AMBER)
        d.text((46, 248), "> It's your side.", font=f15b, fill=AMBER, anchor="ls")
        d.text((46, 282), "/etc/hosts line 12 pins api.acme.dev → 10.0.0.5 (stale).",
               font=f14, fill=BODY, anchor="ls")
        d.text((46, 308), "It's live from US, EU & Asia — remove that line.",
               font=f14, fill=BODY, anchor="ls")
        d.text((46, 342), "— one net_diagnose call · local-first · zero telemetry",
               font=f12, fill=MUT, anchor="ls")
    return img


frames, durations = [], []


def add(img, ms):
    frames.append(img)
    durations.append(ms)


add(draw_state(0, 0, False), 700)
for n in range(1, len(PROMPT) + 1):
    add(draw_state(n, 0, False), 45)
add(draw_state(len(PROMPT), 0, False, cursor=False), 350)
add(draw_state(len(PROMPT), 0, False), 350)
add(draw_state(len(PROMPT), 1, False, cursor=False), 650)
add(draw_state(len(PROMPT), 2, False, cursor=False), 650)
add(draw_state(len(PROMPT), 3, False, cursor=False), 700)
add(draw_state(len(PROMPT), 3, True, cursor=False), 3000)

frames[0].save("assets/demo.gif", save_all=True, append_images=frames[1:],
               duration=durations, loop=0, optimize=True, disposal=2)
print("wrote assets/demo.gif frames:", len(frames))
