# Roadmap: heic-convert

## Overview

One phase delivers the complete app: a single-page HEIC-to-JPEG converter where the user drops files, sets quality, converts in the browser, and downloads results. There are no meaningful delivery boundaries between input, conversion, and download — nothing is usable until all three work together.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Working App** - Complete HEIC-to-JPEG converter — drop files, set quality, download results (completed 2026-03-08)

## Phase Details

### Phase 1: Working App
**Goal**: User can drop HEIC files into the browser, set JPEG quality, convert entirely client-side, and download the results individually or as a ZIP
**Depends on**: Nothing (first phase)
**Requirements**: INPUT-01, INPUT-02, CONV-01, CONV-02, DL-01, DL-02
**Success Criteria** (what must be TRUE):
  1. User can drag and drop one or more HEIC files onto the page and see them accepted
  2. User can click to open a file picker and select HEIC files as an alternative to drag-and-drop
  3. User can adjust a quality slider and convert the files to JPEG — all processing happens in the browser with no network requests to a server
  4. User can download each converted JPEG individually
  5. User can download all converted JPEGs as a single ZIP file
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — HTML structure and CSS styling for the converter page
- [ ] 01-02-PLAN.md — JavaScript behavior: file input, conversion, and downloads

## Progress

**Execution Order:**
Phases execute in numeric order: 1

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Working App | 2/2 | Complete    | 2026-03-08 |
