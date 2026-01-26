# Production Readiness & Security Plan

Status: in progress
Owner: Codex
Created: 2026-01-26

## Goals
- Harden auth/session handling and protect sensitive routes.
- Eliminate credit manipulation and make billing/credits atomic and auditable.
- Reduce data exposure (private storage, safe file access).
- Add SSRF and abuse controls to AI and scraping functions.
- Improve middleware scope/perf and security headers.

## Priority Work Items

### 1) Credits & Billing Integrity (Critical) — in progress
- Lock down profile updates so users cannot change `credits` directly. (done)
- Implement atomic credit increment/decrement via SQL RPC (SECURITY DEFINER). (done)
- Add webhook idempotency (store event IDs and ignore duplicates). (done)
- Update Stripe/Paddle handlers to use RPC and idempotency checks. (done)

### 2) Storage Privacy & Access (High)
- Make `original-scans` private (and likely other buckets as needed).
- Replace public URLs with signed URLs or proxy download endpoint.
- Update UI upload flows accordingly.

### 3) API/Route Security (High)
- Add CSRF/origin checks or require bearer tokens for sensitive POST routes.
- Ensure middleware preserves Supabase cookies on redirects.
- Narrow middleware matcher scope to necessary paths.

### 4) SSRF and Abuse Controls (High)
- Validate URLs in scrape function (scheme allowlist, block private IPs).
- Add timeouts, size limits, and rate limits to scrape/AI endpoints.

### 5) HTML/Content Safety (Medium)
- Escape/sanitize user content inserted into generated HTML (PDF).

### 6) Security Headers & Config (Medium)
- Add CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options.

## Open Questions
- Should `original-scans` be private or intentionally public?
- Are both Stripe and Paddle intended for production, or is one legacy?

## Notes
- No code changes until you confirm after this plan file.
