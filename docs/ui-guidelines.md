# UI Guidelines

This document defines the core UI guidelines for the TODO application.

## Visual Style

1. Use a clean, minimal layout with generous whitespace between sections.
2. Use a consistent color palette: a primary accent color for actions (buttons, links), a neutral background, and a distinct color for destructive actions (e.g. delete).
3. Use a single, legible sans-serif font family across the app.
4. Completed tasks should be visually de-emphasized (e.g. strikethrough text, muted color).
5. Overdue tasks should be visually highlighted (e.g. red text or badge) so they stand out from other tasks.

## Components

6. Use consistent button styles: primary buttons for main actions (Add Task), secondary/outline buttons for less common actions, and a clearly distinct style for destructive actions (Delete).
7. Use a checkbox or toggle to mark a task complete/incomplete, positioned to the left of the task title.
8. Use form inputs with visible labels and placeholder text for adding or editing a task.
9. Show a loading indicator while data is being fetched, and an inline error message when a request fails.

## Layout & Responsiveness

10. The app must be usable on both desktop and mobile screen widths (responsive layout).
11. Keep the task list as the central focus of the page, with the add-task form above or alongside it.

## Accessibility

12. All interactive elements (buttons, inputs, checkboxes) must be keyboard-navigable and have visible focus states.
13. Use sufficient color contrast between text and background to meet WCAG AA standards.
14. Icons used without accompanying text must include descriptive `aria-label` attributes.
