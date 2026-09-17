# GATE 3B — COMPLETE

**Run of record:** `20260916T154601Z` · script v3B.3 `e4e142bcc4851d232638ff093b0d1c3385c0085f1012b5b204e95d70dfaebe0a`
**Result:** 7 ok · 0 failed · 0 skipped · evidence manifest 27 entries · self-check PASSED
**Evidence:** `~/Projects/_governance/gate3b/20260916T154601Z`

---

## What is now true

`agoraxai-control-plane` is frozen at **v0.1**, commit `6a4954fbb5b81bac67c26ee96b0b38231c057845`
— the first commit in that repository, 28 files, worktree clean, **no remote**. A verified bundle
sits at `~/Projects/_archives/2026-09-16/agoraxai-control-plane-6a4954fbb5b8-20260916T154601Z.bundle`,
`a0efaf6396e7aa5c96e23daf789e32c5c0813893d47680a3b831dd60e70cd114`, 98,716 bytes, verified twice
with `list-heads` matched against the commit.

| Row | Result |
|---|---|
| P0 preflight | 9 files backed up and hashed · index clean · 0 remotes |
| P1 fixes | registry v1.5 → v1.5.1 (3 hunks) + 21 anchored code edits across 7 files · 0 residual markers |
| P2 validate | build · typecheck · **15/15 unit** · local audit: 32 files, 0 credential matches, 0 remotes |
| P3 browser | **15/15** including the corrected mobile-nav test |
| P4 freeze | v0.1 at `6a4954fbb5b8` · 28 files · bundle verified twice · 0 paths left dirty |
| P5 B1 FCC audit | clean — 0 confirmed secrets in tracked history · **nothing created, nothing pushed** |
| P6 Pınar preflight | destination clear · 0 unresolved source paths · **no extraction** |

## The defect, and why the guard was not weakened

`audit.mjs:11` asserts `dist/main.js` contains no browser network client. `src/main.ts` imports
`data/snapshot.json`, esbuild inlines it, so **registry prose becomes bundle text**. One line I had
written in `PROJECT_REGISTRY_v1.5.yaml` named those APIs literally, and the row describing the audit
tripped the audit.

The fix reworded the prose and **tightened** ingestion: `import-registry.mjs` now refuses any source
document containing such a literal, naming the file. Fault-injected and verified live. `audit.mjs`
is unchanged.

| | |
|---|---|
| `PROJECT_REGISTRY_v1.5.yaml` | `50543c9a…f800c` — withdrawn before first use, unmodified on disk |
| `PROJECT_REGISTRY_v1.5.1.yaml` | `67e79803…2d0071` — ingested and committed in v0.1 |
| `PROJECT_REGISTRY_v1.6.yaml` | `494bd33e056350c15524a87fe73e9adc02bb6e8bfcd79ea4e801ec58f5b43286` — portfolio record of the freeze |

v1.6 validates against the ingestion contract (18/18 unique rows, all categories valid, zero YAML
errors or warnings) but the tool is **deliberately not repointed at it**. It stays on v1.5.1 inside
its own commit until a change to the control plane makes a repoint worth a second commit.

## Three corrections to my earlier reporting

1. **The mobile-navigation defect does not exist.** Measured on the unfixed stylesheet at 390px:
   scrollWidth 797 vs clientWidth 353, narrowest button 73px. `white-space:nowrap` makes each flex
   item's automatic `min-width` its min-content width, so `flex-shrink` cannot crush it. I reasoned
   about flex defaults instead of measuring.
2. **The regression test written against that claim was vacuous** — it passed on the unfixed
   stylesheet. It now asserts the scroller's block padding, and fails without the fix.
3. **`tests/browser.mjs` had a pre-existing locator defect** that would have failed P3 anyway: the
   approval-queue button's accessible name depends on layout, so `'Approval queue 22'` matched
   nothing at mobile width.

## Reversal, if you ever want it

```
git -C ~/Projects/agoraxai/control-plane reset --soft HEAD~1
cp -R ~/Projects/_governance/gate3b/20260916T154601Z/backup/ ~/Projects/agoraxai/control-plane/
```

Nothing was pushed, no remote exists, no Supabase, no deployment, no DNS, no ERP, nothing deleted.

## Still held, unchanged

B2 (FCC remote creation and push) · Pınar Option B extraction (prepared, tested, unscheduled) ·
Supabase Phase A (D1, human-performed, dashboard-only) · every production, DNS, ERP and secret
operation.
