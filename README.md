# DocuSync

A local-first, collaborative document editor with offline synchronization, field-level conflict resolution, and full version history. Built for the House of Edtech Fullstack Developer assignment.

**Live demo:** [add your Vercel URL here]

**Author:** [Your Name] · [GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-profile)

## What this is

A document editor where the browser, not the server, is the source of truth. You can open a document, lose your internet connection entirely, keep editing and formatting text, and everything keeps working — no spinners, no blocked UI, no lost keystrokes. When the connection comes back, changes sync automatically in the background.

This isn't a CRUD app with an offline banner bolted on. The local-first architecture, the sync queue, and the conflict resolution logic are the actual core of the project.

## Tech stack

- **Next.js 16** (App Router) + Tailwind CSS
- **PostgreSQL** (Supabase) via **Prisma ORM**
- **NextAuth.js** (Google OAuth)
- **IndexedDB** (via `idb`) for local-first client storage
- **Tiptap** rich text editor
- **Groq** (Llama 3.3 70B) for AI writing assistance
- **Nodemailer** (Gmail) for collaboration invite emails
- Deployed on **Vercel**

## Core features

### 1. Local-first architecture

Every keystroke is debounced and written to IndexedDB first — never blocked on a network call. The editor is fully usable with zero connectivity. `src/lib/db.js` wraps IndexedDB with a small API (`saveDocumentLocally`, `getLocalDocument`, sync queue helpers) so the rest of the app never talks to the browser database directly.

### 2. Background sync engine

`src/lib/syncEngine.js` watches the browser's `online`/`offline` events and also polls every 30 seconds as a fallback. Pending changes live in an IndexedDB-backed queue with a status field (`PENDING` → `DONE`). When sync succeeds, the queue item is marked done and the local copy is overwritten with the server's authoritative (possibly merged) result, not the client's optimistic guess.

### 3. Field-level conflict resolution

This is the part of the assignment we spent the most time on, because naive last-write-wins causes real data loss in a multi-collaborator scenario.

The problem with whole-document overwrite: if Alice (offline) edits only the title and Bob (offline) edits only the content, and Bob syncs first, a naive "whoever syncs last wins" sync would let Alice's sync completely overwrite Bob's content change with her stale local copy of the content, even though she never touched it.

Our fix: each client remembers a `base` snapshot, what the document looked like the last time it successfully synced. When syncing, the client sends its base alongside its current values. The server checks, per field, whether the client's value differs from its own base. If it differs, the client actually changed that field, so the server applies it. If not, the server preserves whatever's currently on the server (the other collaborator's change). This means two people editing different fields offline both keep their work. If two people edit the exact same field, that field falls back to last-write-wins, a documented, narrower tradeoff than losing an entire field's contents.

See `src/app/api/documents/[id]/sync/route.js` for the implementation.

What we'd do with more time: implement a proper CRDT (e.g. Yjs) for character-level merging within the same field, so even simultaneous edits to the same paragraph merge instead of one overwriting the other.

### 4. Version history & time travel

Users can save a labeled snapshot of a document at any point (`DocumentVersion` table) and browse a timeline of past versions. Restoring a version is non-destructive — it only updates the in-memory editor content, it never deletes history, so users can always restore again or save a fresh version afterward.

### 5. Roles & authorization

Documents support Owner, Editor, and Viewer roles via the `DocumentCollaborator` table. Authorization is enforced server-side on every API route, not just hidden in the UI — a Viewer's sync request is rejected with a 404 at the Prisma query level (the document simply doesn't match their permitted `WHERE` clause), so there's no way to bypass it by hitting the API directly.

### 6. Sharing with email invites

Owners can share a document by email, assign a role, and the invited user receives an email (via Nodemailer/Gmail) with a direct link to the document. The dashboard separates "My Documents" from "Shared with Me."

### 7. Security & data validation

- OOM protection: every sync request's `content-length` header is checked before the body is parsed; oversized payloads (over 500KB) are rejected with a 413 before they're ever loaded into memory.
- Input validation: title length and type are validated server-side regardless of what the client sends.
- Tenant isolation: every Prisma query is scoped to `session.user.id` via `WHERE` clauses — there is no endpoint that returns another user's document without an explicit ownership or collaborator check.
- Auth on every route: all API routes call `auth()` first and reject unauthenticated requests before touching the database.

### 8. AI writing assistant

Integrated via Groq (Llama 3.3 70B): summarize, improve writing, convert to bullets, shorten, formalize, continue writing, or ask a custom prompt — all scoped to the current document content (truncated to 5000 characters to bound cost and latency).

## Architecture decisions & tradeoffs

**Why IndexedDB over localStorage?** localStorage is synchronous, string-only, and capped around 5-10MB. IndexedDB is async (doesn't block the main thread), supports structured data, and scales to much larger documents, which is necessary for a "local-first" claim to actually hold up under real usage.

**Why field-level merge instead of full CRDT?** A true CRDT (Yjs/Automerge) gives character-level conflict-free merging, which is the gold standard. Given the timeline, we implemented a narrower but still meaningful improvement over last-write-wins: field-level merging prevents the most common failure mode (two people editing different parts of a document) while being honest that same-field simultaneous edits still resolve via last-write-wins. This is a deliberate, explainable scoping decision rather than a hidden gap.

**Why last-write-wins with version numbers for the rest?** It's deterministic — given the same set of operations, every client converges to the same final state, which is the property the assignment explicitly asks for. It's simpler to reason about and debug than vector clocks for a project at this stage.

**Why Prisma scoping instead of native PostgreSQL Row Level Security?** Supabase supports RLS, but enforcing tenant isolation at the ORM query layer (every `findFirst`/`findMany` includes an explicit ownership/collaborator check) gives the same practical guarantee while keeping all access logic in one reviewable place (the API routes) instead of split between application code and database policies. For a larger team or higher-stakes data, RLS as a defense-in-depth second layer would be the next addition.

**Known limitation, document size over time:** Version snapshots currently store full HTML content rather than diffs. For very long-lived, frequently-versioned documents this would grow the `DocumentVersion` table significantly. A production fix would be diffing against the previous version and reconstructing full content on read, trading write-time complexity for storage efficiency.

## Database schema overview

- **User** — synced from Google OAuth via NextAuth
- **Account / Session** — NextAuth-managed OAuth and session records
- **Document** — title, content, owner, monotonically increasing version number
- **DocumentCollaborator** — links a User to a Document with a role (OWNER / EDITOR / VIEWER)
- **DocumentVersion** — labeled snapshots of a document for time travel
- **SyncQueue** — server-side log of sync operations (status: PENDING / DONE / FAILED)

## Getting started locally

Clone and install dependencies:

```bash
git clone <repo-url>
cd docusync
npm install --legacy-peer-deps
```

Create a `.env` file in the project root: