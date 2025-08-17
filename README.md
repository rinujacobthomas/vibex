# vibex fitness — Landing Site

Static single-page site for **vibex fitness** matching the brand poster.

## Structure
- `index.html` — main page
- `styles.css` — theme (dark, red accents)
- `script.js` — waitlist form POST to backend
- `assets/` — logo & poster

## Configure the Waitlist Endpoint
Edit `script.js` and set:
```js
const ENDPOINT_URL = "YOUR_APPS_SCRIPT_OR_FUNCTION_URL";
```

## Deploy on GitHub Pages
1. Create a new repo (e.g., `vibex-fitness-site`).
2. Put these files in the repo root.
3. Go to **Settings → Pages**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/root`
4. Your site will be at `https://<username>.github.io/<repo>/`.

> This repo includes a `.nojekyll` file to disable Jekyll so all assets load.
