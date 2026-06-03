#!/usr/bin/env python3
"""
image-utils.py -- Image intelligence for Social Card Skill.

Provides:
- extract_dominant_colors: find dominant hues from an image
- recommend_object_position: suggest object-position for subject-aware cropping
- assess: combined CLI that outputs JSON for use in render pipelines

Requires: Pillow (pip install Pillow)

Usage:
  python scripts/image-utils.py assess assets/hero.jpg --output json
  python scripts/image-utils.py colors assets/hero.jpg --count 3
"""
import sys
import json
import math
import argparse
from pathlib import Path
from collections import Counter

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run: pip install Pillow")

# ============================================================
# Dominant color extraction
# ============================================================

def extract_dominant_colors(image_path, n=3):
    """
    Extract dominant colors using color quantization.
    Returns list of [r, g, b] hex-strings sorted by coverage.
    """
    img = Image.open(image_path).convert("RGB")
    # Resize for speed while keeping color distribution
    img = img.resize((200, 200))
    # Quantize to n+8 colors then take top n
    q = img.quantize(colors=n + 8, method=Image.Quantize.MEDIANCUT)
    q = q.convert("RGB")

    pixels = list(q.getdata())
    freq = Counter(pixels)
    top = freq.most_common(n)

    results = []
    for (r, g, b), count in top:
        pct = round(count / len(pixels) * 100, 1)
        results.append({"hex": f"#{r:02x}{g:02x}{b:02x}", "rgb": [r, g, b], "coverage_pct": pct})

    return results

# ============================================================
# Object-position recommendation via edge-density gradient
# ============================================================

def recommend_object_position(image_path, board_ratio="3:4"):
    """
    Estimate where the subject is vertically and return a recommended
    object-position CSS value like 'center 62%'.

    Uses a simple edge-density heuristic:
    - Convert to grayscale
    - Apply Sobel-like edge detection (diff of adjacent bands)
    - Find the vertical band with highest edge density
    - Return center N% where N maps to the densest band
    """
    img = Image.open(image_path).convert("L")
    w, h = img.size

    # Resize for speed
    scale = 300 / max(w, h)
    if scale < 1:
        img = img.resize((int(w * scale), int(h * scale)))
        w, h = img.size

    pixels = list(img.getdata())

    # Compute horizontal edge density per row
    row_edges = []
    for y in range(1, h - 1):
        edge_sum = 0
        row_start = y * w
        for x in range(1, w - 1):
            idx = row_start + x
            # Simple gradient magnitude
            gx = abs(pixels[idx + 1] - pixels[idx - 1])
            gy = abs(pixels[idx + w] - pixels[idx - w])
            edge_sum += gx + gy
        row_edges.append(edge_sum)

    if not row_edges:
        return "center 50%"

    # Find the band with highest edge density (subject zone)
    band_h = max(4, h // 12)
    best_band = 0
    best_density = 0
    for i in range(0, len(row_edges) - band_h, band_h // 2):
        density = sum(row_edges[i:i + band_h])
        if density > best_density:
            best_density = density
            best_band = i

    # Map best_band to a percentage position
    center_y = min(95, max(5, int((best_band + band_h // 2) / h * 100)))

    # Adjust based on board ratio
    if board_ratio == "3:4":
        # Portrait: subject tends to sit slightly higher than center
        pass
    elif board_ratio == "21:9":
        # Wide: subject at center is usually right
        center_y = min(85, max(15, center_y))

    # Confidence: ratio of best density to average
    avg_density = sum(row_edges) / max(1, len(row_edges))
    confidence = round(min(1.0, best_density / (band_h * avg_density + 1)), 2)

    return {"object_position": f"center {center_y}%", "confidence": confidence}

# ============================================================
# CSS tint generator for image-overlay.md
# ============================================================

def generate_localized_tint(dominant_colors, position="bottom"):
    """
    Generate a CSS radial-gradient tint based on dominant colors.
    Compatible with image-overlay.md Rule 1 (localized, image-toned).

    Returns a CSS gradient string and recommended alpha value.
    """
    if not dominant_colors:
        return {"css": "none", "alpha": 0}

    main = dominant_colors[0]["rgb"]
    r, g, b = main

    if position == "bottom":
        css = f"radial-gradient(80% 30% at 50% 95%, rgba({r},{g},{b},0.22), transparent 70%)"
    elif position == "top":
        css = f"radial-gradient(80% 30% at 50% 5%, rgba({r},{g},{b},0.22), transparent 70%)"
    elif position == "left":
        css = f"radial-gradient(30% 80% at 5% 50%, rgba({r},{g},{b},0.22), transparent 70%)"
    elif position == "right":
        css = f"radial-gradient(30% 80% at 95% 50%, rgba({r},{g},{b},0.22), transparent 70%)"
    else:
        css = "none"

    return {"css": css, "alpha": 0.22}

# ============================================================
# CLI
# ============================================================

def cmd_assess(args):
    image_path = Path(args.image)
    if not image_path.exists():
        sys.exit(f"File not found: {image_path}")

    colors = extract_dominant_colors(str(image_path), n=3)
    pos = recommend_object_position(str(image_path), args.board)
    tint = generate_localized_tint(colors, args.tint_position)

    result = {
        "image": str(image_path),
        "dominant_colors": colors,
        "recommended_object_position": pos,
        "tint": tint,
    }

    if args.output == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Image: {result['image']}")
        print(f"Colors:")
        for c in colors:
            print(f"  {c['hex']} ({c['coverage_pct']}%)")
        print(f"Object-position: {pos['object_position']} (confidence: {pos['confidence']})")
        print(f"Tint: {tint['css']}")

def main():
    parser = argparse.ArgumentParser(description="Image intelligence for Social Card")
    sub = parser.add_subparsers(dest="command")

    assess = sub.add_parser("assess", help="Full assessment")
    assess.add_argument("image", help="Path to image file")
    assess.add_argument("--output", choices=["json", "text"], default="text")
    assess.add_argument("--board", default="3:4", help="Target board ratio")
    assess.add_argument("--tint-position", default="bottom", choices=["top", "bottom", "left", "right"])

    colors = sub.add_parser("colors", help="Extract dominant colors only")
    colors.add_argument("image")
    colors.add_argument("--count", type=int, default=3)

    args = parser.parse_args()

    if args.command == "assess":
        cmd_assess(args)
    elif args.command == "colors":
        result = extract_dominant_colors(args.image, n=args.count)
        for c in result:
            print(f"{c['hex']} ({c['coverage_pct']}%)")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
