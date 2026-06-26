# CashPilot Changelog

## [Unreleased] -- 2026-06-26

### Added
- Invoice model with line items, indexing, payment tracking
- Transaction model with category-based aggregation
- Full Invoice CRUD REST API with error handling
- Runway forecasting engine: burn rate, monthly revenue, days of cash
- Overdue invoice detection and alerting
- InvoiceCard React component with status badge and action buttons
- useDashboard hook with 60-second auto-refresh
- Currency formatting utilities with compact notation
- Cashflow breakdown by category (last N months)

### Changed
- Improved MongoDB indexes for query performance
- Separated analytics into dedicated service layer

## [v1.06260918] -- 2026-06-26
### Notes
- Run ID: 20260626091835