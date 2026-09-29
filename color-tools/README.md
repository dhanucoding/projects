# Color Converter & Contrast Checker

Convert between HEX/RGB/HSL and check WCAG contrast ratios for a foreground/background pair.

## Features
- Live two-way conversion between HEX, RGB, and HSL — edit any field and the rest update instantly.
- Native color-picker swatches alongside the text fields for both the converter and the contrast checker.
- Live preview swatch showing large and normal sample text on the chosen foreground/background pair.
- Contrast ratio computed live, with pass/fail badges for WCAG AA and AAA at both normal and large text sizes.

## How it works
Entirely client-side, no build step or dependencies. HEX/RGB/HSL conversion
and the WCAG relative-luminance/contrast-ratio formulas are hand-rolled (no
color libraries). Contrast thresholds follow the WCAG 2.1 success criteria:
AA normal 4.5:1, AA large 3:1, AAA normal 7:1, AAA large 4.5:1.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-09-28 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
