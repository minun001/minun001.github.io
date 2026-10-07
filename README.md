# Hyunsik Min Website

Personal academic website for Hyunsik Min, published with GitHub Pages.

## Sections

- Home
- Profile
- Publications
- News
- Dashboard (`/workspace/`) for private, authenticated access

## Local Development

This site uses Jekyll.

```bash
bundle install
bundle exec jekyll serve
```

Build the static site:

```bash
bundle exec jekyll build
```

## Deployment

The site is deployed from the `main` branch through GitHub Pages.

## Google Scholar Updates

- `.github/workflows/update-scholar-metrics.yml` checks daily at 00:15 KST and can be run manually from Actions. Source changes run tests only; snapshot commits never trigger another Scholar request.
- Before fetching, `--skip-if-fresh` validates **both** JSON snapshots and skips an already successful check for the current KST date. The manual `force_refresh` option bypasses this skip.
- Successful live checks alone advance `checked_at`. A failed profile or publication-detail request never publishes partially fetched data.
- After a successful refresh, the workflow explicitly requests and verifies a branch-based GitHub Pages build, since `GITHUB_TOKEN` pushes do not trigger Pages automatically. A manual run with already-fresh data also verifies publication of the current snapshot.
- Scholar sometimes rejects hosted runners with HTTP 403. A recent, complete snapshot can be retained with an explicit `deferred` warning/Actions summary, **not** an update success. Missing/invalid snapshots, parser errors, and snapshots at least three days old still fail visibly. Transient network errors have bounded retries; access challenges are not bypassed.
- A separate trusted Windows PC can perform the strict daily fallback at 01:30. This requires the PC to be on, the user to be signed in, Python, and existing Git push access. No new credential is stored by these scripts. If both environments are blocked, no new data is claimed; use the linked Scholar profile and investigate the stale-data failure.

Register or update the existing fallback task (optionally supply an absolute `-Python` path):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\register_scholar_local_fallback_task.ps1 -At 01:30
```

Run a strict check manually from the repository root:

```bash
python -B tools/update_scholar_metrics.py --skip-if-fresh
python -B -m unittest discover -s _tests -p test_scholar_refresh.py -v
```

The fallback uses the existing dedicated `.scholar-sync-worktree` checkout so ordinary website edits remain untouched. It prints operational messages to the console without writing extra local log files.

## Notes

- Public site content lives in the root pages and `assets/`.
- Dashboard auth and analytics client settings live in `assets/workspace-config.js` and `assets/site-analytics-config.js`.
- Private dashboard tables and policies are defined in `tools/workspace_supabase_schema.sql`.
- Starter private dashboard content is defined in `tools/workspace_supabase_seed.sql`.
- Do not commit service-role keys, database passwords, or other backend secrets.
