# Privacy Requirements

This application STRICTLY enforces the following:

- **Zero Persistence**: No databases (PostgreSQL, MySQL, MongoDB, etc.) are allowed. No `localStorage`, `sessionStorage`, or `IndexedDB`.
- **Ephemeral State**: All extracted data is held in React/Node memory only, and immediately destroyed when the session ends or tab is closed.
- **Credential Safety**: The React frontend must NEVER intercept, process, or store the SRMIST password. Passwords are entered directly into the SRMIST portal via the Playwright instance running locally on the user's machine.
