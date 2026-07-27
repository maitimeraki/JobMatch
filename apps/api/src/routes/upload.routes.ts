import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/", "video/", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.some((t) => file.mimetype.startsWith(t) || file.mimetype === t)) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, PDF, and DOC files are allowed"));
    }
  },
});

const router = Router();

router.post("/", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  const mediaType = req.file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
  res.json({ success: true, data: { url, mediaType } });
});

export default router;
