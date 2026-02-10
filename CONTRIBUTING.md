# Contributing to Zombie Escape Online

Thank you for your interest in contributing! This guide will help you get started.

## Local Development Setup

### Prerequisites

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (only needed for the level generator)
- [Python 3](https://www.python.org/) + `firebase-admin` pip package (only needed to push levels to Firestore)

### Running the Game

```bash
cd frontend
make run
```

This starts Firebase Emulators in Docker:
- **Game**: http://localhost:5000
- **Emulator UI**: http://localhost:4000 (inspect Firestore data, auth state)

Emulator data persists in `firebase-data/` and auto-imports on restart.

## How to Contribute

### Reporting Bugs

Open an issue using the **Bug Report** template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and device info
- Screenshot if applicable

### Suggesting Features

Open an issue using the **Feature Request** template. Describe the problem your feature solves and any ideas for implementation.

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test locally with the emulators (`make run`)
5. Push and open a Pull Request

### Contributing Levels

Levels are generated and validated algorithmically:

```bash
cd generator
node generate_catalog.js     # generates catalog.json with 100 levels per tier
python3 push_catalog.py      # interactive: choose how many per tier, push to local emulator
```

If you want to hand-craft a level, it must be a grid of characters:
- `P` = Player start, `E` = Exit, `Z` = Zombie, `#` = Wall, `.` = Empty
- The level **must** be solvable (verify with `node verify_current_levels.js`)

### Contributing Themes (Skins)

Skins are defined in `skins.js` and styled via CSS classes in `styles.css`. To add a new skin:

1. Add an entry to the `SKINS` array in `skins.js` with a unique `id`, `name`, and `description`
2. Add a `.skin-{id}` CSS class in `styles.css` defining colors for:
   - `--color-bg`, `--color-wall`, `--color-player`, `--color-zombie`, `--color-exit`, `--color-text`
3. Test it locally — skins randomize on page load, or use the Skins menu

## Code Style

- **Vanilla JavaScript** — no frameworks, no build step
- **ES6 modules** in the browser (`import`/`export`)
- Use `logger` from `utils/logger.js` instead of `console.log` (logs are suppressed in production)
- CSS-based animations and theming — no JS animation loops
- Each file in `modules/` has a single responsibility — keep it that way
- Use `textContent` instead of `innerHTML` for any user-facing text (XSS prevention)

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Test with Firebase Emulators before submitting
- Don't commit `.env`, API keys, or `node_modules/`
- If adding a new module, follow the existing pattern in `modules/`

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
