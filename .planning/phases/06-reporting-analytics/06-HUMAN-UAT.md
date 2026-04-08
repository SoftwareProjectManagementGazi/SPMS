---
status: partial
phase: 06-reporting-analytics
source: [06-VERIFICATION.md]
started: 2026-04-08T19:55:00.000Z
updated: 2026-04-08T19:55:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Recharts chart rendering
expected: Navigate to /reports; AreaChart (burndown), PieChart donut with Durum/Öncelik tabs (distribution), and BarChart (velocity) render as actual SVG charts, not text
result: [pending]

### 2. Export file download
expected: Click PDF or Excel button in ExportButton dropdown; browser initiates download of SPMS_Report_[key]_[date].{pdf,xlsx} and toast shows "Rapor indirildi."
result: [pending]

### 3. FilterBar refetch
expected: Change project in FilterBar; all chart panels show Skeleton loaders and reload with new project's data
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
