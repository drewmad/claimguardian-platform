# Contributing to ClaimGuardian

We welcome contributions to the ClaimGuardian project! To ensure a smooth and collaborative development process, please follow these guidelines.

## Getting Started

1.  **Fork the repository** and clone it to your local machine.
2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up pre-commit hooks:**

    Husky is used to enforce code quality and consistency before commits. After `pnpm install`, Husky hooks should be automatically set up. If not, you can manually install them:

    ```bash
    pnpm install # This should trigger husky postinstall
    # Or manually:
    # npx husky install
    ```

    The `pre-commit` hook runs:
    *   `pnpm deps:check`: Ensures `pnpm-lock.yaml` is up-to-date.
    *   `pnpm lint`: Runs ESLint checks.
    *   `pnpm type-check`: Runs TypeScript type checks.

4.  **Make your changes.** Adhere to the existing code style and project structure.

5.  **Run tests and checks locally:**

    ```bash
    pnpm test
    pnpm lint
    pnpm type-check
    pnpm deps:check
    ```

6.  **Commit your changes** with a clear and concise message. Follow Conventional Commits if possible (e.g., `feat: add new feature`, `fix: resolve bug`).

    ```bash
    git commit -m "feat: your commit message"
    ```

7.  **Push your branch** to your forked repository:

    ```bash
    git push origin feature/your-feature-name
    ```

8.  **Open a Pull Request (PR)** to the `main` branch of the upstream repository. Provide a clear description of your changes.

## Code Style and Quality

*   **ESLint & Prettier:** Code is automatically formatted and linted. Ensure your IDE is set up to use the project's ESLint and Prettier configurations.
*   **TypeScript:** All new code should be written in TypeScript with strict typing.
*   **Turborepo:** Follow Turborepo conventions for task definition, caching, and workspace management.

## Documentation

*   **Code Metadata:** Add JSDoc-style `@fileMetadata` headers to new or modified code files as per the project's documentation standards.
*   **PRD/Design Docs:** Update relevant sections of the PRD or design documents if your changes introduce new features or alter existing functionality.

## Testing

*   Write unit and integration tests for new features or bug fixes. Aim for high test coverage.
*   Ensure all existing tests pass before submitting a PR.

## Need Help?

If you have any questions or get stuck, feel free to reach out to the project maintainers.
