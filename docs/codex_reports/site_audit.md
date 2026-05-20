# Site Audit

## Site framework

- Repository: `C:\Users\user\minun001.github.io`
- Framework: Jekyll/GitHub Pages repository.
- VLA page implementation: static standalone HTML at `VLA/index.html` with inline CSS.
- No `package.json` was found. README documents Jekyll commands: `bundle exec jekyll serve` and `bundle exec jekyll build`.

## Entry point file(s)

- Public VLA URL entry: `VLA/index.html`
- Site-wide shared files exist under `_layouts/`, `_includes/`, and `assets/`, but the current VLA page does not depend on the shared layout.

## Asset directories

- VLA assets: `VLA/assets/`
- Global website assets: `assets/`

## Current VLA page sections before update

- Hero section for previous `CARLA P2 adjacent cut-in diagnostic`.
- Four side-by-side CARLA GIF cards.
- Previous 150 paired-trial metric cards for adjacent cut-in.
- Static PNG figure section using old comparison charts.
- Previous metric table.
- Claim boundary section for adjacent cut-in.

## Existing GIF/image asset inventory

VLA-specific GIFs:

- `VLA/assets/carla_event_a.gif`
- `VLA/assets/carla_event_b.gif`
- `VLA/assets/carla_event_c.gif`
- `VLA/assets/carla_event_d.gif`

VLA-specific PNGs:

- `VLA/assets/01_core_metric_comparison.png`
- `VLA/assets/02_relative_change_summary.png`
- `VLA/assets/03_paired_trial_robustness.png`
- `VLA/assets/04_vehicle_order_ttc.png`
- `VLA/assets/05_summary_table.png`

Note: existing GIF names are generic and do not encode whether the visual is Ramp merge or Speed-gap stress.

## Recommended file changes

- Replace `VLA/index.html` content with the final 150-trial Ramp merge / Speed-gap stress comparison.
- Keep existing `VLA/assets/carla_event_a-d.gif` references only where paths exist.
- Do not reuse old metric PNGs as final evidence because they correspond to the previous adjacent cut-in result.
- Add/update `AGENTS.md` with VLA website rules.
- Add subagent reports under `docs/codex_reports/`.
- Add `docs/missing_gif_assets.md` to document scenario-labeled GIF gaps.

## Build/test/lint commands

- `bundle exec jekyll build`
- `bundle exec jekyll serve`

No Node/Vite/React commands were discovered.

## Risks or uncertainties

- Existing GIFs are valid files, but their filenames do not prove scenario-specific provenance.
- Old PNG metric charts should not be shown as the final Ramp merge / Speed-gap stress evidence unless regenerated with final source-of-truth data.
- Repository contains unrelated dirty/untracked files; changes should remain scoped to VLA page and docs.
