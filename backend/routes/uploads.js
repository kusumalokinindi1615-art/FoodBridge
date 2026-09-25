const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/* ─── Storage: backend/uploads (served statically by server.js) ── */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ALLOWED[file.mimetype] || path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed'));
  },
});

/* ─── POST /api/uploads (DONOR/NGO/VOLUNTEER) ──────────
   multipart/form-data, field name: "image" */
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded (field name must be "image")' });
    // Public URL — server.js serves /uploads statically
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

/* Multer-specific error handling */
router.use((err, req, res, next) => {
  const msg =
    err.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 5 MB)' :
    err.message || 'Upload failed';
  res.status(400).json({ message: msg });
});

module.exports = router;
