<!-- File: docs/product-overview.md -->
# Product Overview

## Product summary

Lovique is a web-based AI companion product. A user creates an account, chooses the kind of companion they want, and chats inside a private dashboard that keeps conversations, preferences, and remembered notes connected to that account.

The product is positioned as a calm, personal, always-available companion experience rather than a generic chatbot playground.

## Problem Lovique solves

Many AI chat apps are either:

- too technical
- too generic
- too temporary
- or too impersonal

Lovique tries to solve that by giving users:

- an account-based private space
- a more emotionally consistent companion tone
- saved chat sessions they can return to
- lightweight long-term memory
- simple settings instead of complicated prompt engineering

## Who the product is for

Lovique is currently best suited for people who want:

- a one-to-one AI companion experience
- a softer, more personal chat tone
- recurring conversations instead of one-off prompts
- control over companion preferences such as personality and companion gender

It is not currently positioned as a productivity assistant, team tool, or enterprise platform.

## Core product promise

Lovique should feel:

- personal
- easy to start
- emotionally warm
- visually polished
- persistent across sessions

From a user perspective, the promise is simple:

> Create an account, choose your companion vibe, and return to a private space where your chats and preferences still feel connected.

## Main user journey

### 1. Discover

The landing page explains:

- what Lovique is
- how it works
- what the user gets after signup
- that personality and preference controls exist

### 2. Create an account

The user registers with:

- name
- email
- password
- companion gender
- companion personality
- adult confirmation during signup

### 3. Enter the dashboard

After authentication, the user lands in a private app area with:

- a chat workspace
- recent conversations
- navigation sidebar
- access to settings

### 4. Start or resume conversations

The user can:

- start a new conversation
- reopen an older session
- rename a session
- delete a session

### 5. Adjust preferences later

The user can visit Settings to update:

- companion gender
- companion personality
- password
- remembered notes

## Core features

### Authentication and account access

- account registration
- login
- logout
- current session lookup
- forgot password
- reset password
- change password

### Companion customization

Users choose the companion style directly.

Current personality options:

- `Sweet`
- `Playful`
- `Calm`
- `Romantic`

Users also choose companion gender directly and can change it later from settings.

### Conversation experience

- session-based chat history
- automatic conversation titles
- saved recent conversations
- private dashboard experience
- warm, concise reply style by default

### Memory

Lovique uses lightweight persistent memory so important facts can carry across chats without sending the full conversation history every time.

Examples of remembered facts include:

- preferred name
- favorite things
- location
- work or studies
- likes and dislikes
- explicit "remember this" notes

### Reliability and user experience

The product tries to feel resilient rather than technical. When services are slow or waking up, the UI uses friendly language instead of raw infrastructure errors.

Examples:

- sleeping backend is presented as Lovique waking up
- Gemini failures are translated into user-friendly service messages
- toast notifications and inline states explain what is happening

### Trust, safety, and policy posture

The product is designed to feel personal, but there are still boundaries.

Current system behavior includes:

- account-based access with session cookies
- password reset and recovery flow
- remembered notes tied to the user account
- AI responses instructed to avoid becoming explicit or sexual
- adult confirmation enforced during registration

This is important because Lovique is not just a plain stateless chat box. It stores account state, conversations, and memory-related data to make the experience feel continuous.

## Product differentiators

Compared with a generic AI chat app, Lovique is differentiated by:

- account-based continuity
- companion tone and personality controls
- remembered notes across sessions
- saved conversations with lightweight management
- a product-style UI instead of a raw chat demo

## Current non-goals

At the moment, Lovique does not aim to be:

- a multi-user social platform
- a workplace productivity assistant
- a voice-first product
- a marketplace of many character types
- a heavy CRM-style memory system
- a payments or subscription platform

## Success signals

If the product is working well, useful metrics would include:

- signup conversion from landing page to registration
- first-message activation rate after signup
- repeat usage through returning sessions
- average conversations per active user
- settings engagement for personality and preference changes
- password recovery completion rate
- low error rate for auth and chat flows

## Product language guide

When describing Lovique publicly, prefer phrases like:

- "AI companion"
- "private chat space"
- "saved conversations"
- "remembered notes"
- "companion personality"
- "your dashboard"

Avoid describing it like:

- a developer demo
- a prompt playground
- a generic assistant
- a human replacement

## Short positioning statement

Lovique is a private AI companion web app where users can sign up, choose the kind of companion they want, and return to saved, personal conversations inside a polished account-based dashboard.
