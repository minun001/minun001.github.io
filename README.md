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

## Notes

- Public site content lives in the root pages and `assets/`.
- Dashboard auth and analytics client settings live in `assets/workspace-config.js` and `assets/site-analytics-config.js`.
- Private dashboard tables and policies are defined in `tools/workspace_supabase_schema.sql`.
- Starter private dashboard content is defined in `tools/workspace_supabase_seed.sql`.
- Do not commit service-role keys, database passwords, or other backend secrets.
