# SATprep.io Hostinger Fix

Upload/replace these files at the TOP LEVEL of the GitHub repository.

Key changes:
- Express pinned to v4.
- Build now creates Vite dist and copies it to runtime_assets.
- Server searches runtime_assets first, then dist.
- index.html points to /main.js to match the current flat GitHub layout.

Keep Hostinger settings:
- Express
- main
- Node 20.x
- root ./
- npm
- entry file server.js
- keep the two existing VITE_SUPABASE environment variables.

After commit, allow auto-deploy or click Redeploy.
