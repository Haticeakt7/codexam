# CLAUDE.md

# Codexa Development Guidelines

## Project Overview

Codexa is a production-grade online coding exam and assessment platform built with:

* ASP.NET Core Web API
* PostgreSQL
* Redis
* SignalR
* React + TypeScript
* Monaco Editor
* Docker-based isolated code runners

The system supports:

* realtime participant monitoring
* coding exams
* anti-cheat mechanisms
* dockerized code execution
* dynamic quiz configuration
* customizable coding workspace
* replay/event systems
* scalable assessment workflows

This project must be treated as a serious full-stack distributed system, not a simple CRUD application.

---

# CRITICAL DEVELOPMENT FLOW

Before starting ANY task:

## ALWAYS READ DOCUMENTS IN THIS ORDER

1. `ROADMAP.md`
2. `memory-bank/` directory contents
3. `docs/` directory contents

This is mandatory.

You must understand:

* current architecture
* previous decisions
* existing abstractions
* pending tasks
* project direction
* technical constraints

before making changes.

---

# AFTER COMPLETING ANY TASK

You MUST update documentation.

Always update:

* `ROADMAP.md`
* relevant `memory-bank/` documents
* relevant `docs/` documents

Documentation updates are NOT optional.

You must document:

* architectural changes
* new flows
* new APIs
* schema changes
* important decisions
* limitations
* future TODOs

---

# GENERAL ENGINEERING PRINCIPLES

## DO NOT:

* create hacky solutions
* duplicate business logic
* hardcode API values
* tightly couple frontend/backend
* bypass architecture
* create temporary implementations
* introduce inconsistent patterns
* break existing abstractions
* use static/translatable UI strings directly
* ignore realtime synchronization concerns

---

## ALWAYS:

* think production-first
* prefer scalable solutions
* preserve maintainability
* preserve extensibility
* write reusable abstractions
* keep API contracts strongly typed
* validate edge cases
* think about concurrency/realtime behavior
* keep state predictable
* optimize performance-sensitive areas
* preserve UX consistency

---

# BACKEND GUIDELINES (.NET)

## Architecture

Backend uses ASP.NET Core Web API.

Preferred architecture:

* clean layering
* service-based business logic
* repository abstraction where necessary
* DTO-based API boundaries
* centralized validation

Suggested structure:

* Controllers
* Services
* Repositories
* Entities
* DTOs
* Validators
* SignalR Hubs
* Background Workers

---

## Swagger/OpenAPI

Swagger quality is mandatory.

If Swagger documentation is missing or incomplete:

* complete endpoint descriptions
* add summaries
* add request/response examples
* document validation responses
* document authentication requirements
* document realtime endpoints if applicable

Swagger must remain professional and frontend-consumable.

---

## Validation

Use:

* FluentValidation
* centralized validation patterns

Avoid:

* controller-level validation clutter
* duplicated validation logic

---

## Database

Database:

* PostgreSQL

Use:

* Entity Framework Core
* proper migrations
* strongly typed entities

Important:

* use JSONB where flexibility is required
* avoid schema chaos
* preserve relational consistency

Never:

* manually edit production schema
* bypass migrations

---

## Realtime Systems

Realtime systems are critical in this project.

Examples:

* participant monitoring
* live code watching
* realtime exam events
* status synchronization

Use:

* SignalR properly
* typed hub events where possible
* throttling/debouncing where needed

You must think carefully about:

* reconnection
* synchronization
* race conditions
* stale state
* event flooding

Realtime systems must remain scalable.

---

## Background Jobs

Use:

* Hangfire
* Redis-backed queues

Background jobs may include:

* code execution
* cleanup jobs
* automatic quiz state updates
* replay persistence
* analytics processing

Never block API threads with long-running operations.

---

## Docker Runner System

Code execution runs inside isolated Docker containers.

You must preserve:

* sandbox safety
* resource limitations
* timeout handling
* execution isolation

Never:

* execute code directly on host
* bypass isolation
* trust user input

---

# FRONTEND GUIDELINES (React)

## General Frontend Principles

Frontend stack:

* React
* TypeScript
* Zustand
* TailwindCSS
* Monaco Editor
* SignalR Client

Frontend must remain:

* responsive
* scalable
* accessible
* performant

---

## i18n IS MANDATORY

NEVER hardcode user-facing text.

ALL visible text must use i18n translation keys.

Examples:

* buttons
* labels
* placeholders
* tooltips
* validation messages
* modal texts
* notifications
* empty states

Avoid:

* inline static strings
* untranslated fallback UI

---

## Styling Rules

Use:

* theme-compatible styling
* reusable UI patterns
* design consistency

Avoid:

* random inline styles
* inconsistent spacing
* inconsistent colors
* hardcoded visual values

UI must support:

* theme switching
* future dark/light customization
* scalable component styling

---

## Monaco Editor Rules

Monaco is performance-sensitive.

You must:

* avoid unnecessary rerenders
* debounce expensive updates
* preserve editor state
* preserve cursor position where possible
* avoid recreating editor instances unnecessarily

Workspace customization must remain stable.

---

## Workspace Persistence

Workspace state includes:

* panel layout
* panel positions
* panel sizes
* editor theme
* font size

Persistence rules:

Anonymous users:

* localStorage

Authenticated users:

* database persistence

You must safely synchronize:

* local state
* remote preferences

Avoid:

* accidental preference overwrites
* stale workspace states

---

## State Management

Use predictable state patterns.

Avoid:

* duplicated state
* deeply nested uncontrolled state
* scattered business logic

Prefer:

* centralized reusable stores
* derived state where appropriate

---

# API CONTRACT RULES

Frontend must NEVER hardcode:

* supported languages
* quiz statuses
* enums
* dynamic settings

All dynamic values should come from backend APIs whenever appropriate.

API contracts must remain:

* typed
* documented
* version-safe

---

# PERFORMANCE RULES

This platform contains:

* realtime systems
* Monaco editor
* draggable layouts
* Docker execution
* analytics
* websocket traffic

Performance matters.

You must:

* debounce persistence
* throttle resize/layout events
* avoid expensive rerenders
* memoize where needed
* avoid unnecessary websocket traffic

---

# SECURITY RULES

Always think about:

* authorization
* quiz access validation
* participant isolation
* secure token generation
* anti-cheat event integrity
* replay/event safety

Never trust frontend validation alone.

Backend validation is mandatory.

---

# UX PRINCIPLES

The platform should feel:

* modern
* professional
* responsive
* reliable
* developer-friendly

Avoid:

* confusing workflows
* hidden behaviors
* inconsistent interactions

The coding experience is one of the most important parts of the platform.

---

# TESTING EXPECTATIONS

Before finalizing changes:

* validate backend endpoints
* validate SignalR flows
* validate persistence behavior
* validate responsive layouts
* validate Monaco stability
* validate docker execution flows

Avoid shipping partially tested realtime behavior.

---

# IMPORTANT FINAL RULE

When implementing features:

* think like a senior engineer
* think about future scalability
* think about production environments
* think about concurrency
* think about maintainability
* think about developer experience

Do not optimize only for "working".

Optimize for:

* stability
* clarity
* scalability
* maintainability
* long-term architecture quality
