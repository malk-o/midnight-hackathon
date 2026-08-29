# Setup

## 1. Core tools (do this before Friday)

- Node.js LTS — https://nodejs.org
- Git — already set up
- VS Code — https://code.visualstudio.com
- Docker Desktop — likely needed for Midnight's local proof server / node

## 2. Midnight-specific tooling

The exact install steps change between hackathon editions, so **follow the
"Installation" guide linked from the Devpost resources page or the #mlh-hackers
channel** rather than trusting stale instructions. As of the last check, the
general pattern is:

1. Install the Compact compiler (usually via an npm package or a downloadable
   binary — check current docs).
2. Run a local proof server (often via `docker compose up` from a starter repo
   Midnight provides) — this is what actually generates/verifies ZK proofs
   locally during development, so you're not depending on a live network.
3. Install the Midnight JS SDK in the backend (`npm install @midnight-ntwrk/...` —
   confirm exact package names from current docs, they do change).

**Action for Friday during Opening Ceremony / first workshop:** grab the exact,
current install commands from the workshop and drop them into this file so you
have them written down for the rest of the weekend.

## 3. Backend

```
cd backend
npm install
npm run dev
```

## 4. Frontend

```
cd frontend
npm install
npm run dev
```

## 5. Contracts

Compact contracts live in `contracts/`. Compile/test commands depend on the
toolchain version — fill in here once confirmed from the workshop.
