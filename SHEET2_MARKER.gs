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
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();

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
  const markedVal = String(row[3] || '').trim(); // Column D marker (zero-based index 3)
  const seatsAllocatedRaw = row[2]; // Column C (zero-based index 2)
  const seatsAllocated = (typeof seatsAllocatedRaw === 'number') ? seatsAllocatedRaw : Number(seatsAllocatedRaw || 0) || 0;
  matches.push({ firstName: rowFirst, lastName: rowLast, rowIndex: r + 1, marked: markedVal === 'Y', seats: seatsAllocated });
        if (!wantLookupOnly) {
          try {
            // Marker now recorded in Column D (4) instead of Column C (3)
            sheet.getRange(r + 1, 4).setValue('Y');
            rowsUpdated++;
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