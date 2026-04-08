# Lovique Documentation

This folder is the main documentation hub for Lovique.

The goal of this documentation set is to make the project understandable from multiple angles:

- what Lovique is as a product
- how the system is designed
- how each major module works
- how requests flow through the stack
- how to run and deploy the project safely
- how to debug failures without guessing

## Recommended reading paths

### If you are new to the project

1. [Product overview](./product-overview.md)
2. [Technical architecture](./technical-architecture.md)
3. [Module reference](./module-reference.md)

### If you are going to change code

1. [Technical architecture](./technical-architecture.md)
2. [Module reference](./module-reference.md)
3. [Workflows and sequence diagrams](./workflows-and-sequences.md)
4. [Troubleshooting and failure modes](./troubleshooting-and-failure-modes.md)

### If you need to run or deploy the app

1. [Setup, deployment, and operations](./setup-deployment-operations.md)
2. [Troubleshooting and failure modes](./troubleshooting-and-failure-modes.md)

## Documentation map

| Document | Audience | What it answers |
| --- | --- | --- |
| [Product overview](./product-overview.md) | Product, founder, designer, new developer | What Lovique is, who it is for, and what the user journey looks like |
| [Technical architecture](./technical-architecture.md) | Developers, reviewers, technical stakeholders | How the frontend, backend, database, AI provider, and email bridge fit together |
| [Module reference](./module-reference.md) | Developers | What each major file or module does, which functions matter, and what each part depends on |
| [Workflows and sequence diagrams](./workflows-and-sequences.md) | Developers, reviewers, technical stakeholders | How registration, login, reset password, chat, memory, and wake-up flows behave step by step |
| [Setup, deployment, and operations](./setup-deployment-operations.md) | Developers, DevOps, maintainers | How to configure local development, production deployment, environment variables, and verification checks |
| [Troubleshooting and failure modes](./troubleshooting-and-failure-modes.md) | Developers, maintainers, support-minded teammates | What can go wrong, how to diagnose it, current limitations, and how to recover safely |
| [Documentation playbook](./documentation-playbook.md) | Anyone changing the repo | Which docs to update when features, flows, or infrastructure change |

## How this docs set relates to the READMEs

- [Root README](../README.md)
  Repo-level introduction and quick start.
- [Frontend README](../frontend/README.md)
  Frontend-specific setup, scripts, and environment variables.
- [Server README](../server/README.md)
  Backend-specific setup, scripts, routes, and environment variables.

The READMEs remain the quickest setup entry points.

This `docs/` folder goes deeper into:

- design decisions
- architecture
- module responsibilities
- request flows
- deployment behavior
- operational caveats

## Scope and intent

This documentation tries to stay close to the actual implementation in the repository.

That means it intentionally documents:

- real route names
- real environment variables
- real exported functions
- real cross-service dependencies
- real tradeoffs currently visible in code

It does not try to oversell the system or describe capabilities that do not yet exist.

## Source-of-truth rule

When docs disagree with the code:

1. The code is the source of truth for current behavior.
2. The mismatch should be fixed in the docs as soon as possible.
3. The [documentation playbook](./documentation-playbook.md) should be followed so drift stays small.
