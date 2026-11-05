# WebOS

A modern desktop-style workspace that runs entirely in the browser. Built with vanilla HTML, CSS and JavaScript for free static hosting such as GitHub Pages.

## Features
- Desktop launcher, shortcuts, taskbar and draggable/minimizable/maximizable windows
- File Manager with a browser-local virtual file collection, text import and JSON export
- Notes with automatic local saving
- External-link browser launcher
- Calculator with parentheses and standard arithmetic
- Paint canvas with touch/mouse drawing and PNG export
- Calendar reminders
- Safe simulated terminal (never executes host operating-system commands)
- Dark/light appearance, wallpapers and JSON backup/restore
- Installable PWA and offline app-shell cache
- Responsive full-screen app windows on phones

## Deploy
1. Open **Settings → Pages** in this repository.
2. Set the source to **Deploy from a branch**, choose `main` and `/(root)`, then save.
3. Open the Pages URL after deployment.

The repository root contains `index.html`, so no build step or package installation is required.

## Data and security notes
- WebOS is a browser application, not an actual operating system.
- App data is stored in this browser's local storage on this device. It is not synced to other devices or users.
- Import only files you choose. Export backups regularly; clearing browser data can remove local content.
- The browser app opens external sites in a separate tab because many websites prohibit embedding.
- The terminal is a simulator and cannot run commands on your computer.
- Offline support is provided by a service worker and requires HTTPS (GitHub Pages provides HTTPS).

No backend, database server, external API, paid service, advertising, or account is required.
