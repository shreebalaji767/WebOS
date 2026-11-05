# WebOS

A Windows-inspired practical PC simulator that runs entirely in the browser. It is a free-play virtual computer environment for hands-on use; it is not Windows or a full operating system. Built with vanilla HTML, CSS and JavaScript for free static hosting such as GitHub Pages.

## Practical PC environment
- Familiar desktop shortcuts, Start menu, taskbar, notification center and quick settings
- This PC and Recycle Bin desktop entry points, application windows and keyboard shortcuts (Win+E, Win+R)
- Run dialog, virtual lock screen, restart and shutdown session flows
- PC-style window chrome, context menus and system-tray interactions
- Free-play environment with no lessons, missions, instructor, scores or forced tutorials
- Virtual folders and files, drag-and-drop import, rename, soft delete, restore and export
- Virtual files remain separate from the real computer and are stored locally in this browser

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
- Office Studio for local documents and CSV import/export
- Code Studio with an isolated sandboxed HTML preview
- Local audio/video player and PDF reader
- Recycle Bin with restore and permanent deletion for Office Studio documents
- Three virtual workspaces with keyboard switching
- Window snapping for the added applications

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

## Additional local utilities
- File Manager search, rename and Recycle Bin for virtual files
- Local Clipboard Manager for reusable text snippets
- Secure random password generator using browser cryptography; generated passwords are not saved
- Countdown timer and stopwatch with lap tracking

All utility data remains in browser local storage where applicable. Clipboard copy uses the browser clipboard permission only after you select Copy. The media and PDF viewers open files locally and do not upload them.
