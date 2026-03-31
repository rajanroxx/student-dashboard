const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect('mongodb://localhost:27017/students-dashboard')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ── Schemas ───────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  subject: { type: String, required: true },
  test:    { type: String, default: 'General' },
  marks:   { type: Number, required: true },
  total:   { type: Number, required: true },
  date:    { type: Date },
  class:   { type: String, required: true },
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

const fileSchema = new mongoose.Schema({
  originalName: String,
  fileHash:     { type: String, unique: true },
  status:       { type: String, enum: ['processing', 'done', 'failed'], default: 'processing' },
  uploadedAt:   { type: Date, default: Date.now },
  totalRows:    Number,
  savedRows:    Number,
  skippedRows:  Number,
  errors:       [{ row: Number, reason: String }],
});

const UploadedFile = mongoose.model('UploadedFile', fileSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
const toStudent = row => ({
  name:    row['Student Name'],
  subject: row['Subject'],
  test:    row['Test'] || 'General',
  marks:   Number(row['Obtained Marks']),
  total:   Number(row['Total Marks']),
  date:    row['Date'] ? new Date(row['Date']) : null,
  class:   row['Class'],
});

const validateStudent = s => {
  if (!s.name)           return 'Missing Student Name';
  if (!s.subject)        return 'Missing Subject';
  if (!s.class)          return 'Missing Class';
  if (isNaN(s.marks))    return 'Invalid Obtained Marks';
  if (isNaN(s.total))    return 'Invalid Total Marks';
  if (s.marks > s.total) return 'Marks exceed Total';
  return null;
};

const BATCH = 500;
const batchInsert = async docs => {
  for (let i = 0; i < docs.length; i += BATCH)
    await Student.insertMany(docs.slice(i, i + BATCH), { ordered: false });
};

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'running' }));

// ── Classes ───────────────────────────────────────────────────────────────────
app.get('/classes', async (_, res) => {
  try {
    const classes = await Student.distinct('class');
    res.json({ success: true, classes });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Marks: get all / filter ───────────────────────────────────────────────────
app.get('/marks', async (req, res) => {
  try {
    const filter = {};
    if (req.query.class)   filter.class   = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.test)    filter.test    = req.query.test;
    if (req.query.name)    filter.name    = req.query.name;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo)   filter.date.$lte = new Date(req.query.dateTo);
    }
    const data = await Student.find(filter).sort({ date: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Marks: get by class ───────────────────────────────────────────────────────
app.get('/marks/:className', async (req, res) => {
  try {
    const data = await Student.find({ class: req.params.className }).sort({ date: -1 });
    res.json({ success: true, class: req.params.className, count: data.length, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Marks: create single ──────────────────────────────────────────────────────
app.post('/marks', async (req, res) => {
  try {
    const { name, subject, test, marks, total, date, class: cls } = req.body;
    if (!name || !subject || !cls || marks == null || total == null)
      return res.status(400).json({ success: false, message: 'Required: name, subject, class, marks, total' });
    const s = await Student.create({ name, subject, test, marks: Number(marks), total: Number(total), date, class: cls });
    res.status(201).json({ success: true, data: s });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Marks: bulk create ────────────────────────────────────────────────────────
// IMPORTANT: register /marks/bulk BEFORE /marks/:id
app.post('/marks/bulk', async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0)
    return res.status(400).json({ success: false, message: 'records[] required' });

  const valid = [], skipped = [];
  records.forEach((r, i) => {
    const err = validateStudent({ ...r, marks: Number(r.marks), total: Number(r.total) });
    if (err) return skipped.push({ row: i + 1, reason: err });
    valid.push({ name: r.name, subject: r.subject, test: r.test || 'General',
      marks: Number(r.marks), total: Number(r.total),
      date: r.date ? new Date(r.date) : null, class: r.class });
  });

  if (!valid.length)
    return res.status(400).json({ success: false, message: 'No valid records', skipped });

  try {
    await Student.insertMany(valid, { ordered: false });
    res.status(201).json({ success: true, saved: valid.length, skipped,
      message: `Saved ${valid.length} records${skipped.length ? `, skipped ${skipped.length}` : ''}.` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Marks: update ─────────────────────────────────────────────────────────────
app.put('/marks/:id', async (req, res) => {
  try {
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!s) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: s });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Marks: delete ─────────────────────────────────────────────────────────────
app.delete('/marks/:id', async (req, res) => {
  try {
    const s = await Student.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Upload Excel ──────────────────────────────────────────────────────────────
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const existing = await UploadedFile.findOne({ fileHash });
  if (existing) return res.status(409).json({ success: false,
    message: `Already uploaded on ${existing.uploadedAt.toLocaleDateString()}` });

  const fileRecord = await UploadedFile.create({ originalName: req.file.originalname, fileHash, status: 'processing' });

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' });
    if (!rows.length) { await UploadedFile.findByIdAndUpdate(fileRecord._id, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Empty file' }); }

    const valid = [], rowErrors = [];
    rows.forEach((row, i) => {
      const s = toStudent(row);
      const err = validateStudent(s);
      err ? rowErrors.push({ row: i + 2, reason: err }) : valid.push(s);
    });

    if (!valid.length) { await UploadedFile.findByIdAndUpdate(fileRecord._id, { status: 'failed',
      totalRows: rows.length, savedRows: 0, skippedRows: rowErrors.length, errors: rowErrors });
      return res.status(400).json({ success: false, message: 'No valid rows', errors: rowErrors }); }

    await batchInsert(valid);
    await UploadedFile.findByIdAndUpdate(fileRecord._id, { status: 'done',
      totalRows: rows.length, savedRows: valid.length, skippedRows: rowErrors.length, errors: rowErrors });

    res.json({ success: true, message: `Uploaded. ${valid.length} saved, ${rowErrors.length} skipped.`, skipped: rowErrors });
  } catch (err) {
    await UploadedFile.findByIdAndUpdate(fileRecord._id, { status: 'failed' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Analytics endpoint ────────────────────────────────────────────────────────
app.get('/analytics', async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;

    const data = await Student.find(filter);
    if (!data.length) return res.json({ success: true, analytics: {} });

    // Top performers
    const studentMap = {};
    data.forEach(d => {
      if (!studentMap[d.name]) studentMap[d.name] = { name: d.name, marks: 0, total: 0 };
      studentMap[d.name].marks += d.marks;
      studentMap[d.name].total += d.total;
    });
    const topPerformers = Object.values(studentMap)
      .map(s => ({ ...s, pct: s.total > 0 ? (s.marks / s.total) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct).slice(0, 5);

    res.json({ success: true, analytics: { topPerformers, totalStudents: Object.keys(studentMap).length, totalRecords: data.length } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
