# Changelog

## [Unreleased]
### Added
- Recurring invoice auto-generation with cron scheduling
- Multi-currency support with live exchange rate conversion
- Export invoices to PDF via puppeteer
- Bulk invoice status update endpoint
- Client portal with shareable payment links

### Changed
- Improved 90-day runway calculation to use weighted moving average
- Optimized MongoDB aggregation pipeline for cash flow chart
- Invoice search now supports full-text indexing

### Fixed
- Fixed timezone bug in due-date reminder scheduler
- Fixed currency rounding error on multi-line invoices

## [0.1.0] - 2026-06-01
### Added
- Initial release: invoice CRUD, cash flow dashboard, runway forecasting
- JWT authentication with refresh tokens
- Docker Compose deployment
- GitHub Actions CI pipeline