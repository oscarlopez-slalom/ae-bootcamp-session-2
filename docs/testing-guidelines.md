# Testing Guidelines

This document defines the testing requirements for the TODO application.

## Unit Tests

- Use Jest to test individual functions and React components in isolation.
- File naming convention: `*.test.js` or `*.test.ts`.
- Backend unit tests: `packages/backend/__tests__/`
- Frontend unit tests: `packages/frontend/src/__tests__/`
- Name test files to match what they're testing (e.g., `app.test.js` for testing `app.js`).

## Integration Tests

- Use Jest + Supertest to test backend API endpoints with real HTTP requests.
- Location: `packages/backend/__tests__/integration/`
- File naming convention: `*.test.js` or `*.test.ts`.
- Name integration test files based on what they test (e.g., `todos-api.test.js` for TODO API endpoints).

## End-to-End (E2E) Tests

- Use Playwright only, testing with a single browser.
- Location: `tests/e2e/`
- File naming convention: `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey they test (e.g., `todo-workflow.spec.js`).
- Tests must use the Page Object Model (POM) pattern for maintainability.
- Limit E2E tests to 5-8 critical user journeys (focus on happy paths and key edge cases, not exhaustive coverage).

## Port Configuration

- Always use environment variables with sensible defaults for port configuration so CI/CD workflows can dynamically detect ports.
- Backend: `const PORT = process.env.PORT || 3030;`
- Frontend: React's default port is 3000, but can be overridden with the `PORT` environment variable.

## General Requirements

- All tests must be isolated and independent - each test should set up its own data and not rely on other tests.
- Setup and teardown hooks are required so tests succeed on multiple runs.
- All new features should include appropriate tests.
- Tests should be maintainable and follow best practices.
