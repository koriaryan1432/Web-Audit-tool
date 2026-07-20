# Contributing to SiteGrade

Thanks for contributing! This document outlines our development workflow, branch strategy, and conventions.

---

## Code of Conduct

Be respectful, collaborative, and constructive. We're building something great together.

---

## Branch Strategy

We follow a **trunk-based development** model with short-lived feature branches.

```
main          ← Production branch. Protected. No direct pushes.
  └── develop ← Integration branch. All feature branches merge here first.
       └── feature/*  ← Feature branches
       └── fix/*      ← Bug fix branches
       └── docs/*     ← Documentation branches
       └── chore/*    ← Chores
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/short-description` | `feature/ai-recommendations` |
| Bug Fix | `fix/short-description` | `fix/lighthouse-timeout` |
| Documentation | `docs/short-description` | `docs/api-endpoints` |
| Chore | `chore/short-description` | `chore/update-prisma` |
| CI/CD | `ci/short-description` | `ci/add-test-workflow` |
| Security | `security/short-description` | `security/ssrf-fix` |

### Branch Rules
- **`main`** — Protected. Only merge via PR from `develop`. Requires passing CI and 1 review.
- **`develop`** — Integration branch. All feature branches merge here via PR.
- **`feature/*`** — One branch per feature. Delete after merge.
- **Never commit directly to `main` or `develop`.**

---

## Development Workflow

### 1. Start a new feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### 2. Make changes
```bash
pnpm dev          # Start development servers
pnpm lint         # Check linting
pnpm type-check   # Check TypeScript
pnpm test         # Run tests
```

### 3. Commit (Conventional Commits)
```bash
git commit -m "feat: add Stripe checkout integration

Implements Stripe Checkout Sessions for Pro and Agency plan upgrades.

Closes SITE-42"
```

### 4. Push and create PR → Code review → Merge (squash) → Delete branch

### 5. Release: PR from `develop` → `main` → auto-deploy

---

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>: <short description>

[optional body — what and why, not how]

[optional footer — references to issues]
```

### Types

| Type | When to Use |
|------|------------|
| `feat:` | New feature or functionality |
| `fix:` | Bug fix |
| `docs:` | Documentation changes only |
| `style:` | Formatting, no code change |
| `refactor:` | Code restructuring without behavior change |
| `perf:` | Performance improvement |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance, dependencies, config |
| `ci:` | CI/CD configuration |
| `security:` | Security-related changes |

### Examples
```
feat: add AI recommendation generation with GPT-4o
fix: prevent SSRF via internal IP resolution check
docs: add database schema documentation
refactor: extract score calculation into shared package
perf: cache AI responses in Redis with 7-day TTL
chore: update Prisma to v7.0.0
ci: add security audit step to GitHub Actions
security: add CSRF token validation to auth endpoints
```

### Commit Rules
- **First line ≤ 72 characters**
- **Use imperative mood** — "add" not "added"
- **No period at end of first line**
- **Reference Linear issues** in footer: `Closes SITE-42`
- **Separate subject from body with blank line**

---

## Pull Request Process

1. Create PR from `feature/*` → `develop`
2. Fill out PR template (description, type, testing, checklist)
3. Link Linear issue: `Closes SITE-123`
4. Request review (Atlas for code, Atelier for UI)
5. Address feedback, CI must pass
6. Squash and merge to `develop`

### PR Size Guidelines
- **Under 400 lines changed** preferred
- **One concern per PR** — don't mix feature + refactor + docs
- If large (>400 lines), explain why in description

---

## Code Style

### TypeScript
- Strict mode (`strict: true`)
- Prefer `interface` over `type` for object shapes
- No `any` without a comment

### React / Next.js
- Functional components only
- Prefer Server Components unless client interactivity needed
- `'use client'` only when necessary

### Styling (Tailwind CSS)
- Tailwind utility classes directly in JSX
- Extract repeated patterns into components (not `@apply`)
- Mobile-first approach

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `audit-service.ts` |
| Components | PascalCase | `ScoreRing.tsx` |
| Functions | camelCase | `calculateScore()` |
| Types | PascalCase | `AuditResult` |
| Constants | UPPER_SNAKE_CASE | `MAX_AUDIT_TIMEOUT` |
| DB tables/columns | snake_case | `audit_results` |
| Env vars | UPPER_SNAKE_CASE | `DATABASE_URL` |

---

## Testing

### When to Write Tests
- ✅ Business logic (score calculation, URL validation, SSRF checks)
- ✅ API endpoints (request/response, error handling)
- ✅ Database queries (complex queries, RLS policies)
- ✅ Critical user flows (auth, audit creation, payment)
- ⚠️ UI components (test behavior, not visuals)
- ❌ Simple getters/setters, third-party wrappers

### Running Tests
```bash
pnpm test              # All tests
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # Coverage report
```

---

## Documentation

- **Code comments** — explain *why*, not *what*
- **JSDoc** — for public API functions and complex types
- **Keep docs updated** — if behavior changes, update docs in same PR

---

## Getting Help

- **Setup issues?** Check README or ask Atlas
- **Design questions?** Ask Atelier in Figma comments
- **Blocked?** Post in team channel or flag in Linear
- **Security concern?** Email `security@sitegrade.io`

---

**Happy building!** 🚀