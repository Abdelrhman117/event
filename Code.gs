// ============================================================
// Coffee School Event — Google Apps Script Backend
// ============================================================
// 📋 SETUP INSTRUCTIONS:
//   1. Copy this code into Extensions > Apps Script
//   2. Run the setup() function once to create the sheet headers
//   3. Deploy > New Deployment > Web App
//      - Execute as: Me
//      - Who has access: Anyone
//   4. Copy the Web App URL into config.js
// ============================================================

const SHEET_ID   = '1Q_4udw4jC66vl2WSxPeZryi77nnVnTNH45SaA50r7eM';
const SHEET_NAME = 'Registrations';
const ADMIN_PASS = 'coffeeschool2026'; // ← غيّر كلمة السر هنا

// ════════════════════════════════════════════════════════════
// ⚙️  SETUP — شغّل الدالة دي مرة واحدة بس من محرر Apps Script
//    (Run > setup) عشان تنشئ الـ Sheet وتضبط الـ Headers
// ════════════════════════════════════════════════════════════
function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // Create or get the Registrations sheet
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Clear existing content
  sheet.clearContents();
  sheet.clearFormats();

  // Set headers
  const headers = ['ID', 'الاسم', 'اسم الكافيه', 'رقم الموبايل', 'تاريخ التسجيل'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#6f3d1b');
  headerRange.setFontColor('#f5e6c8');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');

  // Set column widths
  sheet.setColumnWidth(1, 160); // ID
  sheet.setColumnWidth(2, 180); // الاسم
  sheet.setColumnWidth(3, 180); // اسم الكافيه
  sheet.setColumnWidth(4, 140); // رقم الموبايل
  sheet.setColumnWidth(5, 180); // تاريخ التسجيل

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set RTL direction
  sheet.setRightToLeft(true);

  Logger.log('✅ Setup complete! Sheet "' + SHEET_NAME + '" is ready.');
  SpreadsheetApp.getUi().alert('✅ تم الإعداد بنجاح!\nالـ Sheet جاهز لاستقبال التسجيلات.');
}

// ── Helpers ──────────────────────────────────────────────────
function getSheet() {
  return SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName(SHEET_NAME);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'الاسم', 'اسم الكافيه', 'رقم الموبايل', 'تاريخ التسجيل']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
}

function generateId() {
  return 'REG-' + Date.now().toString(36).toUpperCase();
}

function rowToObject(row) {
  return {
    id:           row[0],
    name:         row[1],
    cafe:         row[2],
    mobile:       row[3],
    registeredAt: row[4],
  };
}

function corsResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── GET Handler ───────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  const pass   = e.parameter.pass   || '';

  if (action === 'getAll') {
    // Verify admin password
    if (pass !== ADMIN_PASS) {
      return corsResponse({ success: false, error: 'Unauthorized' });
    }
    try {
      const sheet = getSheet();
      ensureHeaders(sheet);
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return corsResponse({ success: true, data: [] });
      }
      const range = sheet.getRange(2, 1, lastRow - 1, 5);
      const rows  = range.getValues();
      const data  = rows.map(rowToObject).filter(r => r.id);
      return corsResponse({ success: true, data });
    } catch (err) {
      return corsResponse({ success: false, error: err.message });
    }
  }

  return corsResponse({ success: false, error: 'Unknown action' });
}

// ── POST Handler ──────────────────────────────────────────────
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return corsResponse({ success: false, error: 'Invalid JSON' });
  }

  const { action, pass } = body;

  // ── Register (public — no password needed) ──
  if (action === 'register') {
    const { name, cafe, mobile } = body;

    // Basic server-side validation
    if (!name || !cafe || !mobile) {
      return corsResponse({ success: false, error: 'All fields are required.' });
    }
    if (!/^01[0125][0-9]{8}$/.test(mobile)) {
      return corsResponse({ success: false, error: 'Invalid mobile number.' });
    }
    if (name.trim().length < 3) {
      return corsResponse({ success: false, error: 'Name too short.' });
    }

    try {
      const sheet = getSheet();
      ensureHeaders(sheet);
      const id  = generateId();
      const now = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
      sheet.appendRow([id, name.trim(), cafe.trim(), mobile.trim(), now]);
      return corsResponse({ success: true, id });
    } catch (err) {
      return corsResponse({ success: false, error: err.message });
    }
  }

  // ── Admin actions (password required) ──
  if (pass !== ADMIN_PASS) {
    return corsResponse({ success: false, error: 'Unauthorized' });
  }

  // ── Update ──
  if (action === 'update') {
    const { id, name, cafe, mobile } = body;
    if (!id || !name || !cafe || !mobile) {
      return corsResponse({ success: false, error: 'Missing fields.' });
    }
    try {
      const sheet   = getSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return corsResponse({ success: false, error: 'No data.' });

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const rowIndex = ids.indexOf(id);
      if (rowIndex === -1) return corsResponse({ success: false, error: 'Record not found.' });

      const row = rowIndex + 2; // +2: 1-indexed + header row
      sheet.getRange(row, 2, 1, 3).setValues([[name.trim(), cafe.trim(), mobile.trim()]]);
      return corsResponse({ success: true });
    } catch (err) {
      return corsResponse({ success: false, error: err.message });
    }
  }

  // ── Delete ──
  if (action === 'delete') {
    const { id } = body;
    if (!id) return corsResponse({ success: false, error: 'ID required.' });
    try {
      const sheet   = getSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return corsResponse({ success: false, error: 'No data.' });

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const rowIndex = ids.indexOf(id);
      if (rowIndex === -1) return corsResponse({ success: false, error: 'Record not found.' });

      sheet.deleteRow(rowIndex + 2);
      return corsResponse({ success: true });
    } catch (err) {
      return corsResponse({ success: false, error: err.message });
    }
  }

  return corsResponse({ success: false, error: 'Unknown action.' });
}
