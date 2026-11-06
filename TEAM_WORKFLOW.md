# Team Workflow

## Owners
| Area | Owner | Reviewer |
|---|---|---|
| `frontend/` | Antriksh | Teammate 4 |
| `backend/` | Darsh | Teammate 4 |
| `research/` | Kushagri | Darsh |
| Integration, deploy, `docs/` | Teammate 4 | Antriksh + Darsh |
| Root product / security docs | All (Antriksh coordinates) | Kushagri |

Replace "Teammate 4" with the fourth member's name once confirmed.

## Branches
- `main` is the production branch — protected, no direct commits, no force-pushes.
- Branch names: `feat/frontend-landing`, `feat/backend-analyze-api`, `feat/rules-engine`,
  `feat/claude-analysis`, `feat/test-cases`, `fix/<short-description>`, `docs/<topic>`.

## Commits
Conventional style: `feat(frontend): add analyzer result panel`, `fix(frontend): hide nav CTA on mobile`,
`docs: update API contract errors`. One logical change per commit.

## Pull requests
1. Branch from up-to-date `main`.
2. Run your area's checks (`cd frontend && npm run check`).
3. Open a PR using the template; link the issue; add screenshots for UI changes.
4. One approving review from the listed reviewer. Never merge your own untested change.
5. Update CHANGELOG.md (and README / contracts if behaviour changed) in the same PR.
6. Squash-merge, then delete the branch.

## Cadence
Kickoff → 10-minute syncs (done / next / blocker) → integration checkpoints:
API contract → stub scan → Claude integrated → tests pass → deployed. Freeze features before the final
rehearsal; after freeze, fix show-stoppers only.

## Task board
Backlog → Ready → In progress → Review → Test → Done. One owner per task, acceptance criteria, one
active P0 task per person.
