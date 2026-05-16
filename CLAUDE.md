# CLAUDE.md — Halcyon Standard | Root Router File
> **ICM Layer 1 — The Global Map**
> Read this file first at the start of every session. Do not open workspace folders until a task is assigned and routed below.
> Last updated: 2026-05-16

---

## WHO YOU ARE WORKING WITH

**Operator:** Sean Price | seanpr1@gmail.com | [REDACTED]
**Location:** Kingsport, TN 37664
**Communication style:** Direct, no fluff. [REDACTED]. Numbered steps. One priority at a time. Front-load decisions.

**Business:**
- **Halcyon Standard** — Residential lawn care & property stewardship. EIN: [EIN-REDACTED]. Sole proprietor, Sullivan County TN. Phone: 423-390-9954 | halcyonstandard.com. Phase 1: mowing/maintenance. Phase 2: Property Condition Index (PCI) platform.

**Current reality check:**
- Active paying clients: Brianna (mowing, biweekly, $80). sample-prospect (warm prospect).
- Sample Customer C: no financial commitment — yard sign opportunity only, not a client.
- Insurance: Active GL via Thimble (confirmed 5/13/26)
- GitHub Pages: seanpr1.github.io/halcyon (3 live files: index.html, operator.html, _estimator-wizard.html)
- Full-time job at [REDACTED] — limited daily bandwidth

---

## WORKSPACE ARCHITECTURE

```
halcyon/
├── CLAUDE.md                ← YOU ARE HERE — read first, always
├── HALCYON.md               ← Operating constitution (Phase 1 reality + Phase 2 vision)
├── clients/
│   ├── context.md           ← Client system rules and template
│   ├── _template.md
│   ├── brianna.md
│   └── sample-prospect.md
├── operations/
│   ├── context.md           ← Operations system rules
│   ├── pricing.md
│   ├── services.md
│   ├── service-area.md
│   └── compliance.md
├── playbooks/
│   ├── context.md           ← Playbook execution rules
│   ├── quote-intake.md
│   ├── first-visit.md
│   ├── recurring-visit.md
│   └── founding-member-onboarding.md
├── marketing/
│   ├── context.md
│   ├── brand-voice.md
│   ├── social-content.md
│   └── lead-nurture.md
├── decisions/
│   └── 2026-05-lawn-care-first-pivot.md
└── phase-2/
    ├── pci-framework.md
    └── tier-structure.md
```

---

## DYNAMIC TASK ROUTING MATRIX

When Sean assigns a task, match it to a row. Load ONLY the listed files. Do not open other folders.

| Task Category | Active Workspace | Load These Files | MCP Tools Allowed | Excluded |
|:---|:---|:---|:---|:---|
| New client / prospect | /clients | context.md, _template.md, [client].md | Google Calendar, Gmail, Reminders | /phase-2, /decisions |
| Pricing / quote | /operations | context.md, pricing.md, services.md | Stripe, Google Calendar | /phase-2, /marketing |
| Scheduling / calendar | /operations | context.md, service-area.md | Google Calendar, Reminders | /phase-2 |
| Service visit / execution | /playbooks | context.md, [relevant playbook].md | Google Calendar, Reminders | /phase-2, /marketing |
| Compliance / legal | /operations | context.md, compliance.md | None (read-only session) | All other folders |
| Writing / social / outreach | /marketing | context.md, brand-voice.md | Gmail, Canva, Google Drive | /phase-2, /operations |
| Yard sign / brand placement | /clients, /marketing | [prospect].md, brand-voice.md | Reminders | /phase-2, /operations |
| Phase 2 strategy | /phase-2 | context.md, pci-framework.md, tier-structure.md | Web search | /clients, /playbooks |
| [REDACTED] / [REDACTED] | (standalone) | Load no workspace files | None | All folders |

---

## SESSION INITIALIZATION PROTOCOL

Every session, in this order:

1. Read `CLAUDE.md` (this file)
2. Identify the task category from the matrix above
3. Load ONLY the context.md for that workspace
4. Load only the specific task file(s) listed
5. Confirm active tools from the Allowed column
6. Begin the 4-stage pipeline: **Brief → Spec → Build → Output**

If the task spans multiple categories: ask Sean which workspace is primary before loading anything.

---

## THE 4-STAGE PIPELINE

Every task must move through these stages. Do not combine stages in one pass.

| Stage | What Happens | Output |
|:---|:---|:---|
| **1. Brief** | Confirm task parameters, constraints, and success criteria | Verbal confirmation from Sean |
| **2. Spec** | Define the structure/approach before building | Outline or schema (markdown) |
| **3. Build** | Execute — generate the content, file, or artifact | Draft file or artifact |
| **4. Output** | Save to designated folder with correct naming | Named file committed or staged |

---

## ARTIFACT NAMING CONVENTIONS

- **Drafts / WIP:** `[project]_[descriptor]_[version].md`
  - Example: `halcyon_pricingmodel_v2_draft.md`
- **Session logs / dated items:** `YYYY-MM-DD_[topic].md`
  - Example: `2026-05-16_client-quote.md`
- **Client files:** `[firstname-lastname].md`
  - Example: `brianna-[lastname].md`
- **Playbooks:** `[action-verb]-[subject].md`
  - Example: `quote-intake.md`, `first-visit.md`

---

## SCOPE ENFORCEMENT

If a task requires a file NOT listed in the routing matrix for the current workspace:
1. Declare it out-of-scope.
2. Name the file being requested and its actual workspace.
3. Ask Sean for permission before opening it.

This protects token budget and keeps each session focused.

---

## OPEN QUESTIONS (do not act on these — surface when relevant)

- [ ] Exact LLC conversion timing
- [ ] Phase 1 → Phase 2 transition trigger (client count? revenue? date?)
- [ ] Founding member discount structure in final form
- [ ] Subcontractor hiring criteria and onboarding standard
- [ ] [REDACTED] CHOICES resolution status ([REDACTED] / attorney meeting)
