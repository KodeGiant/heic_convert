# Requirements: heic-convert

**Defined:** 2026-03-08
**Core Value:** Drop a bunch of HEICs, get JPEGs back with the quality you want — fast and without leaving the browser.

## v1 Requirements

### File Input

- [x] **INPUT-01**: User can drag and drop one or more HEIC files onto the app
- [x] **INPUT-02**: User can click a button to open a file picker and select HEIC files

### Conversion

- [ ] **CONV-01**: Selected HEIC files are converted to JPEG in the browser (client-side)
- [x] **CONV-02**: User can set JPEG quality level before converting (e.g. slider 1–100)

### Download

- [ ] **DL-01**: User can download each converted JPEG individually
- [ ] **DL-02**: User can download all converted JPEGs bundled as a single ZIP file

## v2 Requirements

### File Input

- **INPUT-V2-01**: Show file list with names/sizes before converting
- **INPUT-V2-02**: Remove individual files from the queue before converting

### Conversion

- **CONV-V2-01**: Progress indicator while converting files
- **CONV-V2-02**: Error messages showing which files failed and why

### Download

- **DL-V2-01**: Preview thumbnail of converted image before downloading

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side processing | Files must stay in browser for privacy |
| User accounts / login | Personal tool, not needed |
| Output formats other than JPEG | JPEG only for v1 |
| Resize / rename options | Quality control is sufficient |
| Public hosting / sharing | Personal use only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | Phase 1 | Complete (01-01) |
| INPUT-02 | Phase 1 | Complete (01-01) |
| CONV-01 | Phase 1 | Pending |
| CONV-02 | Phase 1 | Complete (01-01) |
| DL-01 | Phase 1 | Pending |
| DL-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after initial definition*
