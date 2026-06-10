#!/usr/bin/env python3
"""Generate SVG vase placeholder artwork for the Bodhi Swan Ceramics site.

Each placeholder is a flat-style vase silhouette built from a half-profile
(mirrored around the centre line) with a soft glaze gradient and ground
shadow. Run from the repo root:

    python3 tools/generate-placeholders.py
"""

import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "images", "placeholders")

W, H = 600, 750
CX = 300.0
BASE_Y = 640.0

# Right-side half profiles, listed from the mouth (top) down to the foot.
# Points are (half-width, y). Mirrored to build the full silhouette.
PROFILES = {
    "moon-jar": [(52, 196), (60, 210), (118, 268), (152, 360), (148, 460), (110, 560), (62, 620), (56, BASE_Y)],
    "bottle": [(20, 130), (22, 170), (26, 300), (60, 390), (112, 460), (120, 540), (96, 610), (66, 632), (62, BASE_Y)],
    "amphora": [(66, 168), (58, 200), (120, 270), (138, 340), (120, 440), (74, 540), (44, 600), (58, 626), (60, BASE_Y)],
    "cylinder": [(78, 170), (82, 200), (88, 340), (90, 480), (86, 600), (82, BASE_Y)],
    "gourd": [(26, 170), (30, 220), (62, 280), (78, 330), (58, 380), (96, 440), (122, 510), (104, 590), (70, 626), (66, BASE_Y)],
    "low-bowl": [(150, 360), (158, 380), (148, 440), (110, 520), (66, 560), (60, 580), (64, BASE_Y - 40)],
    "tall-taper": [(64, 130), (50, 160), (46, 260), (56, 380), (66, 480), (60, 580), (46, 620), (52, BASE_Y)],
    "shoulder": [(48, 180), (52, 200), (128, 250), (134, 290), (116, 420), (92, 540), (78, 610), (74, BASE_Y)],
    "baluster": [(58, 150), (44, 190), (52, 240), (108, 310), (124, 400), (104, 500), (70, 580), (52, 610), (64, 628), (66, BASE_Y)],
    "trumpet": [(118, 140), (74, 200), (44, 300), (38, 420), (52, 520), (76, 590), (88, 616), (84, BASE_Y)],
    "squat": [(34, 280), (40, 300), (120, 350), (150, 430), (138, 520), (92, 586), (62, 610), (60, BASE_Y - 16)],
    "teardrop": [(28, 160), (32, 220), (54, 320), (88, 420), (104, 510), (92, 590), (62, 622), (58, BASE_Y)],
}

# (name, profile, glaze-top, glaze-bottom, background, ground-shadow)
VASES = [
    ("vase-01", "moon-jar", "#ece5d8", "#cfc4ae", "#f4efe7", "#d8cfc0"),
    ("vase-02", "bottle", "#b8c9b4", "#84a182", "#f1efe6", "#d3d2c2"),
    ("vase-03", "amphora", "#c8835d", "#9e5435", "#f6ece1", "#dccfbe"),
    ("vase-04", "cylinder", "#4f4540", "#28201c", "#efe9e1", "#d5ccc1"),
    ("vase-05", "gourd", "#5d6f93", "#34415f", "#eef0ef", "#d2d6d2"),
    ("vase-06", "low-bowl", "#d9cfbc", "#ab9a7d", "#f3eee5", "#d9d1c2"),
    ("vase-07", "tall-taper", "#a89c8d", "#6f6356", "#f4efe8", "#d9d0c4"),
    ("vase-08", "shoulder", "#8d9a8c", "#5d6f60", "#f0efe7", "#d4d4c6"),
    ("vase-09", "baluster", "#caa66e", "#96703f", "#f5efe4", "#ddd2bf"),
    ("vase-10", "trumpet", "#d8c9c2", "#a98e83", "#f5efea", "#ddd2cb"),
    ("vase-11", "squat", "#7a4a3a", "#4a2a20", "#f3eae2", "#d8cabd"),
    ("vase-12", "teardrop", "#9fb3b5", "#6c8588", "#eef1ef", "#d2d8d4"),
]


def catmull_rom_path(points):
    """Closed smooth path through points using Catmull-Rom -> cubic Bezier."""
    n = len(points)
    d = [f"M {points[0][0]:.1f} {points[0][1]:.1f}"]
    for i in range(n):
        p0 = points[(i - 1) % n]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d.append(
            f"C {c1[0]:.1f} {c1[1]:.1f}, {c2[0]:.1f} {c2[1]:.1f}, {p2[0]:.1f} {p2[1]:.1f}"
        )
    d.append("Z")
    return " ".join(d)


def vase_points(profile):
    right = [(CX + hw, y) for hw, y in profile]
    left = [(CX - hw, y) for hw, y in reversed(profile)]
    return right + left


def render(name, profile_key, top, bottom, bg, shadow):
    profile = PROFILES[profile_key]
    path = catmull_rom_path(vase_points(profile))
    mouth_hw, mouth_y = profile[0]
    foot_y = profile[-1][1]
    shadow_rx = max(hw for hw, _ in profile) * 0.92
    grad_id = f"glaze-{name}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Placeholder image of a ceramic vase">
  <defs>
    <linearGradient id="{grad_id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{top}"/>
      <stop offset="1" stop-color="{bottom}"/>
    </linearGradient>
    <linearGradient id="{grad_id}-sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.10"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="{bg}"/>
  <ellipse cx="{CX}" cy="{foot_y + 14:.0f}" rx="{shadow_rx:.0f}" ry="20" fill="{shadow}" opacity="0.55"/>
  <path d="{path}" fill="url(#{grad_id})"/>
  <path d="{path}" fill="url(#{grad_id}-sheen)"/>
  <ellipse cx="{CX}" cy="{mouth_y:.0f}" rx="{mouth_hw:.0f}" ry="{max(mouth_hw * 0.16, 5):.1f}" fill="#000000" opacity="0.28"/>
</svg>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, key, top, bottom, bg, shadow in VASES:
        out = os.path.join(OUT_DIR, f"{name}.svg")
        with open(out, "w") as f:
            f.write(render(name, key, top, bottom, bg, shadow))
        print(f"wrote {out}")

    # Studio / portrait placeholder: arch motif over a warm field.
    portrait = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" role="img" aria-label="Placeholder portrait image">
  <rect width="600" height="750" fill="#efe7db"/>
  <path d="M 150 640 L 150 330 A 150 150 0 0 1 450 330 L 450 640 Z" fill="#dccfbc"/>
  <circle cx="300" cy="330" r="74" fill="#c8b49a"/>
  <path d="M 186 640 C 196 520 256 470 300 470 C 344 470 404 520 414 640 Z" fill="#c8b49a"/>
</svg>
"""
    with open(os.path.join(OUT_DIR, "portrait.svg"), "w") as f:
        f.write(portrait)
    print("wrote portrait.svg")

    # Exhibition room placeholder: plinths with small vase forms.
    room = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-label="Placeholder image of an exhibition room">
  <rect width="1200" height="750" fill="#f2ede4"/>
  <rect y="560" width="1200" height="190" fill="#e3dccd"/>
  <rect x="180" y="380" width="150" height="200" fill="#faf7f1"/>
  <rect x="180" y="570" width="150" height="12" fill="#d8d0bf"/>
  <rect x="530" y="330" width="150" height="250" fill="#faf7f1"/>
  <rect x="530" y="570" width="150" height="12" fill="#d8d0bf"/>
  <rect x="880" y="410" width="150" height="170" fill="#faf7f1"/>
  <rect x="880" y="570" width="150" height="12" fill="#d8d0bf"/>
  <path d="M 235 380 C 235 350 230 344 230 330 C 230 308 280 308 280 330 C 280 344 275 350 275 380 Z" fill="#9e5435"/>
  <path d="M 580 330 C 580 290 572 282 572 262 C 572 232 638 232 638 262 C 638 282 630 290 630 330 Z" fill="#5d6f93"/>
  <path d="M 930 410 C 930 386 926 380 926 368 C 926 350 984 350 984 368 C 984 380 980 386 980 410 Z" fill="#84a182"/>
</svg>
"""
    with open(os.path.join(OUT_DIR, "exhibition-room.svg"), "w") as f:
        f.write(room)
    print("wrote exhibition-room.svg")


if __name__ == "__main__":
    main()
