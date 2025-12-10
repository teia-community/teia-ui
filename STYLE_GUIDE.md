# Teia UI Coding Style Guide

This document outlines the coding standards and best practices for the Teia UI project.

## Language & File Extensions

-   **TypeScript**: Use TypeScript for all new code and refactoring.
    -   Components: `.tsx`
    -   Logic/Hooks/Utils: `.ts`
-   **Avoid `any`**: Strive to use specific types. Use `unknown` if the type is truly not known yet, but prefer defining interfaces.

## Data Fetching

-   **HTTP Client**: Use the native `fetch` API. Do not use `axios`.
-   **Data Fetching Hook**: Use `swr` for data fetching and caching.

## State Management

-   **Global State**: Use `zustand` for global state management.
-   **Local State**: Use `useState` or `useReducer` for component-local state.

## Styling

-   **CSS Modules**: Prefer CSS Modules (`.module.scss` or `.module.css`) for component-level styling to avoid class name collisions.
-   **Global Styles**: Global styles should be kept to a minimum in `style.css` or `index.css`.

## Component Structure

-   **Functional Components**: Use React functional components.
-   **Props**: Define prop types using interfaces or types.
    ```tsx
    type MyComponentProps = {
      title: string;
      isActive?: boolean;
    };

    export const MyComponent = ({ title, isActive = false }: MyComponentProps) => { ... }
    ```

## Imports

-   **Aliases**: Use configured path aliases (e.g., `@components`, `@atoms`, `@hooks`, `@types`) instead of relative paths (e.g., `../../components`).

## Directory Structure

-   **Atoms**: Basic building blocks (buttons, inputs, etc.).
-   **Components**: More complex UI elements composed of atoms.
-   **Pages**: Top-level route components.
-   **Context**: React Context definitions (legacy, prefer Zustand for new global state).
-   **Hooks**: Custom React hooks.
-   **Utils**: Helper functions.

## Formatting

-   **Prettier**: Ensure code is formatted using Prettier before committing.
-   **Linting**: Address ESLint warnings and errors.
