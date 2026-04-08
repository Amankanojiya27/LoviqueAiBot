<!-- File: docs/documentation-playbook.md -->
# Documentation Playbook

## Why this exists

Documentation is easiest to keep useful when it is small, intentional, and tied directly to code changes.

This playbook is the lightweight rulebook for keeping Lovique's docs healthy as the product evolves.

## Documentation goals

Lovique documentation should help someone quickly answer:

- what the product is
- how it works
- where code responsibilities live
- how to run it locally
- what changed when a feature moved
- which assumptions matter in production

## Documentation set

Current documentation is split by purpose.

### Product and system understanding

- [docs/README.md](./README.md)
- [docs/product-overview.md](./product-overview.md)
- [docs/technical-architecture.md](./technical-architecture.md)
- [docs/documentation-playbook.md](./documentation-playbook.md)

### Repo and setup

- [README.md](../README.md)
- [frontend/README.md](../frontend/README.md)
- [server/README.md](../server/README.md)

## Rule of thumb

Use this guide when deciding where a change belongs:

- If the change affects how Lovique is described as a product, update `docs/product-overview.md`.
- If the change affects how the system works end-to-end, update `docs/technical-architecture.md`.
- If the change affects setup, scripts, env vars, or routes for a single app, update that app README.
- If the change affects the repo entry point or onboarding summary, update the root `README.md`.

## What to update when features change

### When auth changes

Review:

- `server/README.md`
- `docs/technical-architecture.md`
- `docs/product-overview.md` if the user journey changes

Examples:

- new login method
- session strategy change
- password rules
- password reset behavior
- protected-route behavior

### When chat behavior changes

Review:

- `server/README.md`
- `docs/product-overview.md`
- `docs/technical-architecture.md`

Examples:

- new conversation features
- new model/provider
- changed reply style
- session title behavior
- session list behavior

### When preferences or memory change

Review:

- `docs/product-overview.md`
- `docs/technical-architecture.md`
- `frontend/README.md` if routes or settings UI structure change

Examples:

- new personality types
- changed preference fields
- memory extraction updates
- settings page restructure

### When deployment or hosting changes

Review:

- `README.md`
- `frontend/README.md`
- `server/README.md`
- `docs/technical-architecture.md`

Examples:

- new hosting provider
- new proxy strategy
- new env variables
- email delivery changes

## Documentation style guidance

Prefer:

- short sections
- direct language
- product language that matches the UI
- architecture explanations tied to actual files and flows

Avoid:

- giant walls of theory
- vague claims that are not reflected in the app
- stale environment examples
- code-level detail that belongs in comments instead of docs

## Good documentation habits

- update docs in the same PR or commit series as the feature
- document user-facing behavior, not just implementation details
- mention tradeoffs when a design is intentionally limited
- write for a new teammate or future-you, not only for the current moment

## Practical checklist before merging a feature

- Does the root README still describe the product accurately?
- Do the frontend or server READMEs still match the current env vars and scripts?
- Does the product overview still match what a user can actually do?
- Does the technical architecture still match the real request flow?
- Did any public/legal behavior change that should also be reflected in product-facing pages?

## Recommended future docs

As Lovique grows, these would be good next additions:

- release checklist
- production deployment guide
- support and incident response notes
- analytics and success-metrics guide
- content/safety policy notes
- design system or UI pattern guide

## Ownership mindset

There does not need to be one single "documentation person."

The best default is:

- whoever changes product behavior updates product docs
- whoever changes architecture updates technical docs
- whoever changes setup or deployment updates the relevant README

That keeps documentation close to the work and reduces drift.
