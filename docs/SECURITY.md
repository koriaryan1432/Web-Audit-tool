# SiteGrade — Security

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atlas (Full-Stack Engineer)

---

## Table of Contents

1. [Security Posture](#1-security-posture)
2. [OWASP Top 10 Coverage](#2-owasp-top-10-coverage)
3. [SSRF Prevention](#3-ssrf-prevention)
4. [Rate Limiting](#4-rate-limiting)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Data Protection](#6-data-protection)
7. [Infrastructure Security](#7-infrastructure-security)
8. [Secure Development Lifecycle](#8-secure-development-lifecycle)
9. [Incident Response](#9-incident-response)

---

## 1. Security Posture

SiteGrade's unique security challenges:
- **We visit user-supplied URLs** — primary attack vector: SSRF
- **We store audit data** — trust depends on data isolation
- **We handle payments** — PCI via Stripe (never touch card data)
- **We generate AI content** — prompt injection prevention required

### Principles
1. **Defense in depth** — multiple layers, no single point of failure
2. **Least privilege** — minimum necessary access
3. **Secure by default** — all endpoints authenticated unless explicitly public
4. **Fail closed** — deny on security check failure
5. **Never trust user input** — validate, sanitize, constrain all inputs

---

## 2. OWASP Top 10 Coverage

| OWASP | Mitigation |
|-------|-----------|
| **A01: Broken Access Control** | Supabase RLS, JWT validation, API key scoping, random UUID share tokens |
| **A02: Cryptographic Failures** | TLS 1.3, AES-256 at rest, bcrypt API keys (12 rounds), environment secrets only |
| **A03: Injection** | Prisma ORM (parameterized queries), Zod validation, React XSS protection |
| **A04: Insecure Design** | Multi-layer SSRF, rate limiting, audit quotas, threat modeling |
| **A05: Misconfiguration** | Security headers (HSTS, CSP), no debug endpoints, env separation |
| **A06: Vulnerable Components** | Dependabot weekly, npm audit in CI, version pinning, SBOM |
| **A07: Auth Failures** | Supabase Auth, email verification, password strength, login rate limits |
| **A08: Integrity Failures** | CI/CD pipeline, signed commits, pinned actions, Prisma migrations in VCS |
| **A09: Logging Failures** | Sentry errors, audit log, structured logging, alerts |
| **A10: SSRF** | See Section 3 — multi-layer URL validation |

---

## 3. SSRF Prevention

SiteGrade's core function is visiting user-supplied URLs — this is the **#1 security risk**.

### Multi-Layer URL Validation

```
Layer 1: INPUT VALIDATION → parse URL, check protocol (http/https only)
Layer 2: DNS RESOLUTION → resolve hostname to IP addresses
Layer 3: IP RANGE CHECK → block private/reserved IPs
Layer 4: REQUEST EXECUTION → only if all checks pass
```

### Blocked IP Ranges
```typescript
'10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16',  // RFC 1918
'127.0.0.0/8', '::1/128',                           // Loopback
'169.254.0.0/16', 'fe80::/10',                      // Link-local
'169.254.169.254/32',                               // Cloud metadata
'172.17.0.0/16',                                    // Docker
'0.0.0.0/8', '224.0.0.0/4', '240.0.0.0/4',         // Reserved
'100.64.0.0/10',                                    // Carrier-grade NAT
```

### Blocked Hostnames
`localhost`, `localhost.localdomain`, `127.0.0.1`, `0.0.0.0`, `[::1]`
Suffixes: `.local`, `.internal`, `.localhost`

### Additional Protections
- 45-second outbound timeout
- Max response size: 50MB
- No redirect following to blocked ranges
- Network-level isolation on Railway workers

---

## 4. Rate Limiting

| Layer | Mechanism | Limits |
|-------|-----------|--------|
| IP-based | Upstash Redis sliding window | 100 req/min (unauthenticated) |
| User-based | DB query (audits this month) | Free: 3/mo, Pro: 50/mo, Agency: unlimited |
| Auth | Per-IP counter | 5 attempts/15 min |
| AI | Per-audit | 1 call (cached skip) |
| PDF | Queue throttle | Max 5 concurrent jobs |

---

## 5. Authentication & Authorization

**Provider:** Supabase Auth (JWT issuance, email/password, Google OAuth)

**Authorization:** OWNER → ADMIN → MEMBER role hierarchy for Agency plan

**RLS:** All user-data tables have Row-Level Security enabled. Public reports bypass via policy.

**API Keys:** `sg_live_` prefix, bcrypt hashed, validated per-request, inherit owner permissions.

---

## 6. Data Protection

| Data | Classification | Encryption |
|------|---------------|------------|
| User email, name | PII | AES-256 at rest, TLS in transit |
| Passwords | Sensitive | bcrypt + AES-256 (Supabase Auth) |
| Audit results | Business | AES-256 at rest, TLS in transit |
| Payment info | PCI | Stripe-managed (never on our servers) |
| API keys | Sensitive | bcrypt + AES-256 |
| PDF reports | Business | AES-256 at rest (Supabase S3) |
| Session cookies | Sensitive | httpOnly, Secure, SameSite=Lax |

### GDPR
- Right to access: export all audit data
- Right to deletion: "Delete Account" cascades via foreign keys
- Data portability: JSON/CSV export
- Consent: email verification required, marketing opt-in

---

## 7. Infrastructure Security

```
Internet → Cloudflare (DDoS/WAF via Vercel) → Vercel (TLS, CDN) → Railway (private network) → Supabase + Upstash
```

All providers: SOC 2 Type II certified. Stripe: PCI DSS Level 1.

---

## 8. Secure Development Lifecycle

### Development
- Secrets in env vars only (`.env` gitignored)
- Code review required for all PRs
- ESLint: `no-eval`, `no-implied-eval`
- TypeScript strict mode

### CI/CD
- `npm audit --audit-level=high` (fail on high/critical)
- `tsc --noEmit`, `eslint`, `vitest`, `prisma validate`

### Dependencies
- Dependabot weekly scans
- Patch updates auto-merge (tests pass)
- Major bumps: manual review required

---

## 9. Incident Response

| Severity | Criteria | Response |
|----------|----------|----------|
| Critical | Data breach, SSRF exploit, payment compromise | 1 hour |
| High | Service down, auth bypass | 4 hours |
| Medium | Rate limit bypass | 24 hours |
| Low | Minor misconfig | 1 week |

**Process:** Detect → Contain → Investigate → Fix → Communicate (72hrs GDPR) → Post-mortem

**Contacts:** Atlas (Engineering Lead), Ben (PM escalation), Kori (Strategic decisions)

---

## Pre-Launch Checklist

- [ ] All RLS policies tested
- [ ] SSRF validation against all blocked ranges
- [ ] Rate limiting load tested
- [ ] Stripe webhook signature verification active
- [ ] Dependabot running
- [ ] Security headers on all responses
- [ ] No hardcoded secrets
- [ ] Email SPF/DKIM/DMARC configured
- [ ] Incident response plan shared
- [ ] Penetration test scheduled (Phase 2)

---

**Next:** See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.