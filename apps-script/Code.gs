const RECORD_SHEET_NAME = 'Rekod Penghantaran';
const STUDENT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqrfTPsoi5UNXRKoO7-3nlNYlbj2OpL5-VtexlTan_KrVevP6oqwXSaf0SaYnaVNoeVp2wy9R-mpYN/pub?gid=0&single=true&output=csv';
const SUBJECT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqrfTPsoi5UNXRKoO7-3nlNYlbj2OpL5-VtexlTan_KrVevP6oqwXSaf0SaYnaVNoeVp2wy9R-mpYN/pub?gid=2122786713&single=true&output=csv';
const HEADERS = [
  'id',
  'className',
  'date',
  'assignment',
  'subject',
  'student',
  'submission',
  'detail',
  'score',
  'savedAt'
];

function doGet(e) {
  const action = (e.parameter.action || 'records').toLowerCase();
  const callback = e.parameter.callback || '';

  try {
    if (action === 'records') {
      return output({ ok: true, records: getRecords() }, callback);
    }

    if (action === 'dropdowns') {
      return output(getDropdownData(), callback);
    }

    return output({ ok: false, error: 'Action tidak sah.' }, callback);
  } catch (error) {
    return output({ ok: false, error: error.message }, callback);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    if (payload.action !== 'saveRecords') {
      return output({ ok: false, error: 'Action tidak sah.' });
    }

    saveRecords(payload.records || [], payload.replace || {});
    return output({ ok: true, saved: payload.records.length });
  } catch (error) {
    return output({ ok: false, error: error.message });
  }
}

function saveRecords(records, replace) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Tiada rekod untuk disimpan.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getRecordSheet();
    const existing = getRecords();
    const retained = existing.filter((record) => !isSameAssignment(record, replace));
    const cleaned = records.map(normalizeRecord);
    const nextRows = retained.concat(cleaned).map(recordToRow);

    sheet.clearContents();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    if (nextRows.length) {
      sheet.getRange(2, 1, nextRows.length, HEADERS.length).setValues(nextRows);
    }
    sheet.autoResizeColumns(1, HEADERS.length);
  } finally {
    lock.releaseLock();
  }
}

function getRecords() {
  const sheet = getRecordSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values
    .filter((row) => row.some((cell) => cell !== '' && cell !== null))
    .map(rowToRecord);
}

function getDropdownData() {
  const studentRows = fetchCsvRows(STUDENT_SHEET_URL);
  const subjectRows = fetchCsvRows(SUBJECT_SHEET_URL);

  return {
    ok: true,
    classStudents: buildClassStudents(studentRows),
    subjects: buildSubjects(subjectRows)
  };
}

function fetchCsvRows(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Gagal memuat CSV Google Sheet: ' + response.getResponseCode());
  }

  return Utilities.parseCsv(response.getContentText());
}

function buildClassStudents(rows) {
  const result = {};
  rows.slice(1).forEach((row) => {
    const className = String(row[0] || '').trim();
    const studentName = String(row[1] || '').trim();
    if (!className || !studentName) return;
    if (!result[className]) result[className] = [];
    if (result[className].indexOf(studentName) === -1) {
      result[className].push(studentName);
    }
  });
  return result;
}

function buildSubjects(rows) {
  const seen = {};
  const subjects = [];
  rows.slice(1).forEach((row) => {
    const subject = String(row[1] || '').trim();
    if (!subject || seen[subject]) return;
    seen[subject] = true;
    subjects.push(subject);
  });
  return subjects;
}

function getRecordSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(RECORD_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(RECORD_SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => currentHeaders[index] === header);

  if (!hasHeaders) {
    headerRange.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function normalizeRecord(record) {
  return {
    id: String(record.id || makeRecordId(record)),
    className: String(record.className || ''),
    date: normalizeDateValue(record.date),
    assignment: String(record.assignment || ''),
    subject: String(record.subject || ''),
    student: String(record.student || ''),
    submission: String(record.submission || ''),
    detail: String(record.detail || ''),
    score: Number(record.score || 0),
    savedAt: String(record.savedAt || new Date().toISOString())
  };
}

function normalizeDateValue(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const raw = String(value).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return isoMatch[1] + '-' + isoMatch[2].padStart(2, '0') + '-' + isoMatch[3].padStart(2, '0');
  }

  const slashMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    return slashMatch[3] + '-' + slashMatch[2].padStart(2, '0') + '-' + slashMatch[1].padStart(2, '0');
  }

  return raw;
}

function recordToRow(record) {
  const normalized = normalizeRecord(record);
  return HEADERS.map((header) => normalized[header]);
}

function rowToRecord(row) {
  const record = {};
  HEADERS.forEach((header, index) => {
    record[header] = row[index];
  });

  return normalizeRecord(record);
}

function isSameAssignment(record, replace) {
  return String(record.className || '') === String(replace.className || '') &&
    String(record.date || '') === String(replace.date || '') &&
    String(record.assignment || '').toLowerCase() === String(replace.assignment || '').toLowerCase() &&
    String(record.subject || '') === String(replace.subject || '');
}

function makeRecordId(record) {
  return [
    record.className,
    record.subject,
    record.date,
    record.assignment,
    record.student
  ].join('-').toLowerCase().replace(/\s+/g, '-');
}

function output(payload, callback) {
  const json = JSON.stringify(payload);
  const body = callback ? `${callback}(${json});` : json;
  const mimeType = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(body).setMimeType(mimeType);
}
