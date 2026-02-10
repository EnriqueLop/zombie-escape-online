# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it through one of these private channels:

1. **Open a GitHub issue** using the **Bug Report** template (mark it as security-related)
2. **Contact the maintainer privately** via GitHub DM

We appreciate responsible disclosure and will respond as quickly as possible. Please allow up to 90 days for a fix before public disclosure.

## Security Measures

This project implements the following protections:

- **Content Security Policy (CSP)** — prevents XSS and injection attacks
- **Input sanitization** — all user inputs are sanitized before DOM insertion (`textContent` over `innerHTML`)
- **Authentication** — Google OAuth via Firebase Auth
- **Data isolation** — Firestore rules scope user data to authenticated owner only
- **No PII logging** — user emails and personal data are never logged
- **Production-safe logging** — debug logs suppressed in production via `utils/logger.js`

## For Contributors

- Never commit API keys, tokens, credentials, or `.env` files
- Use `textContent` instead of `innerHTML` for untrusted data
- Validate all user inputs at system boundaries
- Keep dependencies updated
- Follow [OWASP Top 10](https://owasp.org/www-project-top-ten/) guidelines
