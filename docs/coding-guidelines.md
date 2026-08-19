# Coding Guidelines

This document defines the coding style and quality principles for the TODO application.

## General Formatting

Code should be consistently formatted across the project. Use 2-space indentation, single quotes for strings in JavaScript, and semicolons at the end of statements. Keep lines reasonably short and break up long expressions for readability. Consistent formatting reduces noise in diffs and makes code review easier.

## Import Organization

Group imports logically: external/third-party packages first, followed by internal modules, followed by relative imports (styles, local components). Avoid unused imports and prefer named imports over wildcard imports where possible, so it's clear exactly what is being used from each module.

## Linting

Use a linter (ESLint) across both the frontend and backend packages to catch common errors and enforce style consistency automatically. Linter warnings and errors should be addressed before merging code, and the linter configuration should be shared across the monorepo so both packages follow the same rules.

## Code Quality Principles

Favor small, single-purpose functions and components over large, monolithic ones. Follow the DRY (Don't Repeat Yourself) principle: extract shared logic into reusable functions or components rather than duplicating code. Prefer clear, descriptive names for variables and functions over abbreviations. Handle errors explicitly (e.g. around network requests) rather than letting failures pass silently. Keep components and modules focused on a single responsibility to make the codebase easier to test and maintain.

## Consistency

New code should match the style of the surrounding codebase. When in doubt, follow existing patterns already used in `packages/frontend` and `packages/backend` rather than introducing a new convention.
