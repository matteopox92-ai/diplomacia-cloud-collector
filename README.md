# Province cloud collector

Code-only prototype for a free GitHub Actions runner. No game data, account identifiers, cookies, tokens, snapshots, browser profiles, recordings or screenshots belong in this repository.

## Current status
The workflow currently performs an anonymous connectivity diagnostic and source tests. It does not log in, collect province data, write to a Site or schedule repeated updates. Successful diagnostics alone do not prove renewable authentication.

The diagnostic prints only booleans and an HTTP status. It examines public application code in memory for authentication-library indicators. It does not print source snippets or API bodies and uploads no artifacts.

## Workflow
Use standard `ubuntu-24.04` hosted runners in a public repository. No paid runners, external browser service, caches, artifact storage, or additional billing configuration are used. The workflow is bounded by an eight-minute timeout. It runs on pushes to main and can be started manually; a recurring schedule is deliberately absent until access and safe persistence are verified.

Dependencies are fixed in package.json and package-lock.json. Dependency lifecycle scripts are disabled; Chromium is installed explicitly using Playwright. The workflow requests only contents:read and clones public source without a stored Git credential.

## Validation
`npm ci --ignore-scripts --no-audit --no-fund`
`npm test`
`npx --no-install playwright install --with-deps chromium`
`npm run diagnose`

Tests use synthetic input and verify public-output filtering. Local browser testing and actual Actions execution must be reported separately.

## Remaining before unattended updates
- Verify the game accepts a standard GitHub-hosted browser.
- Determine the official renewable-authentication flow and test it beyond token expiry.
- Establish a private, encrypted state path; never use public commits, logs, caches or artifacts for session state.
- Add authenticated machine access to the destination Site, keeping its private audience and existing validation.
- Run an authorized real update and read back the persisted result.
- Enable scheduling only after those checks succeed. GitHub schedules can be delayed or skipped and are not a precise five-minute guarantee.

No attempt to defeat CAPTCHA, login restrictions or bot protection is included.
