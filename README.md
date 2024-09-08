# TaurEAV

Desktop web app duplicate of [EAV-table-app](https://github.com/sinsinkun/EAV-table-app)

<img src="./screenshot.png" width="600px" />

UI is cleaned up to more closely resemble native apps

Note: the console keeps the MySQL service running, do not close it

# Installation
- `npm i`
- `npm run tauri build`
- Optional: Add .env file to same folder as .exe with `DATABASE_URL={{mysql_url}}`
  - Will use MySQL default if not provided
