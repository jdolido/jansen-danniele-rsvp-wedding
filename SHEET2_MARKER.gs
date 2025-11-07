function _processRequest(params) {
  const firstName = (params.firstName || '').trim();
  const lastName = (params.lastName || '').trim();
  const name = (params.name || '').trim();
  // Allow an explicit spreadsheet id to be passed for testing/debugging.
  const SPREADSHEET_ID = params.spreadsheetId || params.spreadsheetId || '';
  let ss;
  if (SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {
      return { success: false, error: 'Unable to open spreadsheet by id', details: String(err) };
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  const sheetName = 'Sheet2';
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return { success: false, error: sheetName + ' not found' };
  }

  const data = sheet.getDataRange().getValues();
  const headerRow = data[0] || [];

  function sanitizeHeader(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const normalizedHeaders = headerRow.map(sanitizeHeader);

  function findColumnIndex(label, fallback) {
    const target = sanitizeHeader(label);
    if (!target) return fallback;
    const exactIdx = normalizedHeaders.indexOf(target);
    if (exactIdx >= 0) return exactIdx;
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const head = normalizedHeaders[i];
      if (!head) continue;
      if (head === target) return i;
      if (head.indexOf(target) >= 0 || target.indexOf(head) >= 0) {
        return i;
      }
    }
    return fallback;
  }

  const colLastName = findColumnIndex('last name', 0);
  const colFirstName = findColumnIndex('first name', 1);
  const colSeats = findColumnIndex('seats allocated', 2);
  const colResponded = findColumnIndex('responded?', 3);
  const colCompanions = findColumnIndex('companions', 4);
  const colWillAttend = findColumnIndex('will attend', findColumnIndex('will attend?', 5));

  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  const attendanceValueRaw = (params.attendance || '').trim();
  const attendanceIsYes = attendanceValueRaw.toLowerCase() === 'yes';

  const companionStatusRaw = params.companionStatus || params.companionAttendance || '';
  const companionStatusMap = {};
  let companionStatusProvided = false;
  if (companionStatusRaw) {
    try {
      const parsed = JSON.parse(companionStatusRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach(function(entry) {
          if (!entry) return;
          const normalized = normalizeName(entry.name);
          if (!normalized) return;
          let flag;
          if (entry.attending === true || entry.attending === 'Y') {
            flag = true;
          } else if (entry.attending === false || entry.attending === 'N') {
            flag = false;
          } else if (typeof entry.attending === 'string') {
            const val = entry.attending.trim().toLowerCase();
            if (val === 'true' || val === '1' || val === 'y' || val === 'yes') {
              flag = true;
            } else if (val === 'false' || val === '0' || val === 'n' || val === 'no') {
              flag = false;
            }
          } else if (typeof entry.attending === 'number') {
            flag = entry.attending > 0;
          }
          if (typeof flag === 'boolean') {
            companionStatusMap[normalized] = flag;
            companionStatusProvided = true;
          }
        });
      }
    } catch (err) {
      // Ignore malformed companion payloads
    }
  }

  function shouldMarkCompanionRow(names) {
    if (!attendanceIsYes) return false;
    if (!names || !names.length) return attendanceIsYes;
    if (!companionStatusProvided) return true;
    for (let i = 0; i < names.length; i++) {
      const normalized = normalizeName(names[i]);
      if (!normalized) continue;
      if (Object.prototype.hasOwnProperty.call(companionStatusMap, normalized)) {
        if (companionStatusMap[normalized]) {
          return true;
        }
      } else {
        return true;
      }
    }
    return false;
  }
  // Support a lookup-only mode (does not write markers) so guests can "Find my Invitation".
  const mode = (params.mode || '').trim();
  const wantLookupOnly = mode === 'lookup';
  let rowsUpdated = 0;
  const matches = [];
  // Track partial matches to help frontend show granular errors
  let lastNameMatched = false;
  let firstNameMatchedUnderLast = false;
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
  const colA = String(row[colLastName] || '').trim();
  const colB = String(row[colFirstName] || '').trim();

    // Try to parse last/first name from common formats
    let rowLast = '';
    let rowFirst = '';
    if (colB) {
      // Sheet layout: column A = Last Name, column B = First Name
      rowLast = colA;
      rowFirst = colB;
    } else if (colA.includes(',')) {
      const parts = colA.split(',');
      rowLast = (parts[0] || '').trim();
      rowFirst = (parts[1] || '').trim();
    } else {
      const parts = colA.split(' ');
      rowFirst = (parts[0] || '').trim();
      rowLast = (parts.slice(1).join(' ') || '').trim();
    }

    if (!rowLast) continue;

    if (lastName && rowLast.toLowerCase() === lastName.toLowerCase()) {
      lastNameMatched = true;
      // If the last name matches, check if first name matches; if not, record partial signal
      if (firstName) {
        if ((rowFirst || '').toLowerCase() === firstName.toLowerCase()) {
          firstNameMatchedUnderLast = true;
        }
      }
    }

    if (lastName && firstName && rowLast.toLowerCase() === lastName.toLowerCase()) {
      const lf = (rowFirst || '').toLowerCase();
      const fn = (firstName || '').toLowerCase();
      // Require exact match of first name (case-insensitive)
      if (lf && fn && lf === fn) {
        // Collect matched row for lookup response.
  const markedVal = String(row[colResponded] || '').trim();
  const seatsAllocatedRaw = row[colSeats];
        const seatsAllocated = (typeof seatsAllocatedRaw === 'number') ? seatsAllocatedRaw : Number(seatsAllocatedRaw || 0) || 0;
        const companionLimit = seatsAllocated > 1 ? seatsAllocated - 1 : 0;
        const rawCompanions = [];
        const companionRowRecords = [];
        if (companionLimit > 0) {
          let scanRow = r;
          while (scanRow < data.length && rawCompanions.length < companionLimit) {
            const current = data[scanRow];
            if (!current) break;
            if (scanRow !== r) {
        const nextLast = String(current[colLastName] || '').trim();
        const nextFirst = String(current[colFirstName] || '').trim();
              if (nextLast || nextFirst) break;
            }
            const cell = current[colCompanions];
            if (cell) {
              const text = String(cell).trim();
              if (text) {
                const segments = text.split(/[\n,;]/).map(function(part) { return part.trim(); }).filter(function(part) { return part.length > 0; });
                const candidates = segments.length ? segments : [text];
                const rowNames = [];
                for (let idx = 0; idx < candidates.length; idx++) {
                  if (rawCompanions.length >= companionLimit) break;
                  const candidate = candidates[idx];
                  if (!candidate) continue;
                  rawCompanions.push(candidate);
                  rowNames.push(candidate);
                }
                if (rowNames.length) {
                  companionRowRecords.push({ rowIndex: scanRow + 1, names: rowNames });
                }
              }
            }
            scanRow++;
          }
        }
        const companionEntries = companionLimit > 0 ? rawCompanions.slice(0, companionLimit) : [];
        matches.push({ firstName: rowFirst, lastName: rowLast, rowIndex: r + 1, marked: markedVal === 'Y', seats: seatsAllocated, companions: companionEntries });
        if (!wantLookupOnly) {
          try {
            const attendeeValue = attendanceIsYes ? 'Y' : 'N';
            if (colResponded >= 0) {
              sheet.getRange(r + 1, colResponded + 1).setValue('Y');
              rowsUpdated++;
            }
            if (colWillAttend >= 0) {
              sheet.getRange(r + 1, colWillAttend + 1).setValue(attendeeValue);
              rowsUpdated++;
              companionRowRecords.forEach(function(record) {
                const willAttend = shouldMarkCompanionRow(record.names);
                const valueToWrite = record.rowIndex === r + 1 ? attendeeValue : (willAttend ? 'Y' : 'N');
                sheet.getRange(record.rowIndex, colWillAttend + 1).setValue(valueToWrite);
                rowsUpdated++;
              });
            }
          } catch (err) {
            return { success: false, error: 'Write failed', details: String(err) };
          }
        } else {
          // In lookup-only mode, we only need the first exact match.
          break;
        }
      }
    }
  }

  // If in lookup-only mode, return matches immediately without appending RSVP info.
  if (wantLookupOnly) {
    // matches: [{ firstName, lastName, rowIndex, marked, seats }]
    return { success: true, lookup: true, matches, count: matches.length, lastNameMatched, firstNameMatchedUnderLast };
  }

  // Also append the submission to Sheet1 (Name, Attendance, Guests, High chair, Message, Timestamp)
  const sheet1Name = 'Sheet1';
  const sheet1 = ss.getSheetByName(sheet1Name);
  let rowsAppended = 0;
  if (sheet1) {
    try {
  const displayName = (firstName && lastName) ? (firstName + ' ' + lastName) : (name || '');
  const attendanceVal = params.attendance || '';
  const guestsVal = (typeof params.guests !== 'undefined' && params.guests !== null && String(params.guests) !== '') ? params.guests : '';
  const highChairVal = params.highChair || '';
  const highChairCountVal = (typeof params.highChairCount !== 'undefined' && params.highChairCount !== null && String(params.highChairCount) !== '') ? params.highChairCount : '';
  const messageVal = params.message || '';
  // Columns: A Name, B Attendance, C Guests, D High chair, E How many?, F Message, G Timestamp
  sheet1.appendRow([displayName, attendanceVal, guestsVal, highChairVal, highChairCountVal, messageVal, new Date()]);
      rowsAppended = 1;
    } catch (err) {
      return { success: false, error: 'Append to Sheet1 failed', details: String(err) };
    }
  } else {
    // If Sheet1 is missing, return a non-fatal warning alongside rowsUpdated
    return { success: true, rowsUpdated, warning: sheet1Name + ' not found' };
  }

  return { success: true, rowsUpdated, rowsAppended };
}

function doOptions(e) {
  // Apps Script doesn't let us set CORS headers on ContentService outputs, but returning an empty 204 helps some clients.
  return ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const params = e.parameter || {};
  // If lookup mode requested, process and return matches immediately.
  if ((params.mode || '').trim() === 'lookup') {
    const result = _processRequest(params);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  // Otherwise simple health check / allow JSONP via callback
  const result = { success: true, msg: 'Sheet2 marker is running' };
  const callback = params.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Accept form-encoded data
  const params = e.parameter || {};
  const result = _processRequest(params);

  // Return JSON (JSONP handled by doGet)
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}