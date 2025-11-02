Google Apps Script example: mark matches in Sheet2

1) Create a new Google Apps Script project and paste the code from `SHEET2_MARKER.gs`.
2) Deploy > New deployment > Web app. Set "Who has access" to "Anyone" or appropriate domain. Copy the deployment URL and replace the `url` constant in `src/App.tsx` if needed.
3) The script receives form-encoded POST parameters: `firstName`, `lastName`, `name`, `attendance`, `guests`, `highChair`, `highChairCount`, `message`.
4) The script searches `Sheet2` (by name) for rows with the same last name and a fuzzy-first-name match; when found, it writes `Y` in column D for that row (updated layout) and returns JSON `{ success: true, rowsUpdated, rowsAppended }`.

Notes:
- For production, restrict access and add validation.
- Apps Script may already set CORS headers for web apps deployed as web apps; if CORS errors persist, you may need to use a server-side proxy or set up a Cloud Function with proper CORS.
