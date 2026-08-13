# Inabiya brand (web)

Source masters: `/public/brand-assets/` (design archive — spaces/AI/PDF OK).

This folder is **unmodified copies** for Next.js (`apps/web/public/brand`). Do not crop or trim.

| File | Source (as-is) | Use |
|---|---|---|
| `logo.svg` | `LOGO.svg` | Light nav / lockup (full artwork) |
| `wordmark-color.png` / `lockup-color.png` | `LOGO.png` | PNG fallback of the same lockup |
| `wordmark-on-dark.png` / `lockup-on-dark.png` | `white-color-logo.png` | Dark footer |
| `wordmark-on-light.png` / `lockup-on-light.png` | `black-color-logo.png` | Black lockup on light |
| `mark-color.png` | `Untitled-1.png` | Mobile / compact letter-b |
| `mark-on-dark.png` | `white-B.png` | Letter-b on dark |
| `mark-on-light.png` | `black-B.png` | Letter-b on light |
| `icon-*.png` / `favicon.ico` / `favicon.svg` | white-B on plum `#462947` | Tab favicon / PWA / apple |

Prefer `BrandLogo` / `brandAssets` helpers — don’t hardcode scattered paths.
Scale with `object-contain` only.
