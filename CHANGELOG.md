# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-21

### Added
- URL shortening with custom aliases support
- QR code generation for short links
- Link preview page before redirect
- Analytics dashboard with click tracking
- Link expiration feature
- Link activation/deactivation
- Phishing detection and URL validation
- Rate limiting middleware
- Comprehensive test suite with 56+ unit tests (92% coverage)
- GitHub Actions CI/CD pipeline
- Complete API documentation
- Frontend React interface with Vite
- MongoDB integration with Mongoose

### Security
- HTTPS enforcement for all links
- Anti-phishing URL validation
- Rate limiting on all endpoints
- Helmet.js headers security
- Input validation with Zod
- Environment variables for secrets
- CORS configuration

### Testing
- Jest unit tests for all services
- Jest unit tests for all controllers
- Controller tests with mocked services
- Service tests with mocked models
- 92.83% statement coverage
- 79.5% branch coverage
- 97.91% function coverage

## [0.3.0] - 2026-07-20

### Added
- Click analytics with geographic and device tracking
- Link expiration enforcement
- Referer tracking
- Device/OS/Browser detection
- Comprehensive stats aggregation

### Fixed
- Link expiration validation in redirect route
- Prevented expired links from being accessed

## [0.2.0] - 2026-07-19

### Added
- QR code generation for short links
- Link preview page with security warning
- Custom alias support
- Link metadata (title, tags)
- Link modification endpoints
- List links with pagination and filtering

### Improved
- API response formatting
- Error handling with centralized AppError
- Request validation with Zod schemas

## [0.1.0] - 2026-07-18

### Added
- Basic URL shortening functionality
- Short code generation (6-char alphanumeric)
- MongoDB link storage
- Basic redirect functionality
- Express API setup
- React frontend scaffolding
- Vite build setup
