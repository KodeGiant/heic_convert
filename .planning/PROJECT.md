# heic-convert

## What This Is

A personal web app for batch-converting HEIC photos to JPEG. Drag and drop multiple HEIC files, choose JPEG quality, and download the converted images. Built for private use — no accounts, no tracking, just conversion.

## Core Value

Drop a bunch of HEICs, get JPEGs back with the quality you want — fast and without leaving the browser.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can drop or select multiple HEIC files
- [ ] Files are converted to JPEG in the browser (client-side)
- [ ] User can set JPEG quality before converting
- [ ] User can download individual converted JPEGs
- [ ] User can download all converted JPEGs as a zip

### Out of Scope

- User accounts / login — personal tool, not needed
- Server-side processing — client-side conversion preferred for privacy
- Resize / rename options — quality control is sufficient for v1
- Other output formats (PNG, WebP) — JPEG only for now

## Context

- Personal tool, not public-facing — simplicity over polish
- HEIC is Apple's default photo format; iPhones generate them
- Client-side conversion (using a WASM/JS library like libheif or heic2any) avoids server costs and keeps files private
- Single-page app is sufficient — no routing needed

## Constraints

- **Tech stack**: Web (HTML/CSS/JS) — no framework required, or lightweight if needed
- **Privacy**: Files must not leave the browser — client-side conversion only
- **Dependencies**: Must find a reliable JS/WASM HEIC decoder library

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client-side conversion | Files stay private, no server costs | — Pending |
| Batch + quality control | Core workflow need identified upfront | — Pending |

---
*Last updated: 2026-03-08 after initialization*
