// ===================== IMPORTS =====================
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import session from "express-session"; // 🟢 NEW: dùng để lưu trạng thái đăng nhập
import path from "path";
import { fileURLToPath } from "url";

// ===================== CONFIG =====================
const app = express();
app.use(cors({
  origin: "http://localhost:5500", // 🟢 sửa nếu frontend bạn chạy cổng khác
  credentials: true               // 🟢 cho phép gửi cookie (session)
}));
app.use(express.json());

// ===================== SESSION SETUP =====================
app.use(session({
  secret: "your-secret-key-here", // 🟢 nên thay bằng chuỗi ngẫu nhiên mạnh
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true nếu dùng HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 tiếng
  }
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===================== DATABASE =====================
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root@123",
  database: "job_portal"
});

// ===================== HELPER FUNCTIONS =====================
const sendError = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

// ===================== AUTH APIs =====================

// 🟢 API kiểm tra trạng thái đăng nhập (dành cho frontend)
app.get("/api/check-auth", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 🔹 Đăng ký người dùng (không đổi)
app.post("/api/register", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password)
    return sendError(res, 400, "Thiếu username hoặc password");

  try {
    const [exists] = await db.query(
      "SELECT id FROM job_portal.users WHERE username = ?",
      [username]
    );
    if (exists.length > 0)
      return sendError(res, 400, "Tài khoản đã tồn tại");

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO job_portal.users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, role || "user"]
    );

    res.json({ success: true, message: "Đăng ký thành công" });
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký:", err);
    sendError(res, 500, "Lỗi server");
  }
});

// 🔹 Đăng nhập người dùng (có chỉnh sửa)
app.post("/api/user_login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return sendError(res, 400, "Thiếu username hoặc password");

  try {
    const [rows] = await db.query(
      "SELECT * FROM job_portal.users WHERE username = ?",
      [username]
    );
    if (rows.length === 0)
      return sendError(res, 400, "Tài khoản không tồn tại");

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return sendError(res, 401, "Sai mật khẩu");

    // 🟢 NEW: Lưu trạng thái đăng nhập vào session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error("❌ Lỗi khi đăng nhập:", err);
    sendError(res, 500, "Lỗi server");
  }
});

// 🟢 NEW: API kiểm tra trạng thái đăng nhập
app.get("/api/check_login", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 🟢 NEW: API đăng xuất
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Đăng xuất thành công" });
  });
});

// ===================== JOB APIs (USER) =====================
app.get("/api/jobs", async (_, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM job_portal.companies");
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy jobs:", err);
    sendError(res, 500, "Lỗi database");
  }
});

aapp.post("/api/apply", async (req, res) => {
  const {
    user_id,
    job_id,
    ho_ten,
    gioi_tinh,
    hinh_thuc,
    ngay_sinh,
    cccd,
    noi_cap,
    ngay_cap,
    so_dien_thoai,
    que_quan,
    cong_ty
  } = req.body;

  if (!user_id || !job_id)
    return sendError(res, 400, "Thiếu user_id hoặc job_id");

  try {
    // Kiểm tra xem user đã ứng tuyển job này chưa
    const [exists] = await db.query(
      "SELECT id FROM job_portal.applications WHERE user_id = ? AND job_id = ?",
      [user_id, job_id]
    );
    if (exists.length > 0)
      return sendError(res, 400, "Bạn đã ứng tuyển công ty này rồi!");

    // Insert vào bảng applications
    const sql = `
      INSERT INTO job_portal.applications
      (user_id, job_id, ho_ten, gioi_tinh, hinh_thuc, ngay_sinh, cccd, noi_cap, ngay_cap, so_dien_thoai, que_quan, cong_ty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      user_id, job_id, ho_ten, gioi_tinh, hinh_thuc,
      ngay_sinh, cccd, noi_cap, ngay_cap, so_dien_thoai, que_quan, cong_ty
    ]);

    res.json({ success: true, message: "Ứng tuyển thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi ứng tuyển:", err);
    sendError(res, 500, "Lỗi server");
  }
});


app.get("/api/user/:userId/applications", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT j.id, j.company, j.image, j.type, j.address, j.salary, j.detail, a.applied_at
       FROM job_portal.applied_jobs a
       JOIN job_portal.companies j ON a.job_id = j.id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách ứng tuyển:", err);
    sendError(res, 500, "Lỗi server khi lấy danh sách ứng tuyển");
  }
});

// ===================== ADMIN APIs =====================
app.get("/api/admin/companies", async (_, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM job_portal.companies ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy công ty:", err);
    sendError(res, 500, "Lỗi database");
  }
});

app.post("/api/admin/companies", async (req, res) => {
  const {
    company, image, type, address, age, salary, bonus,
    detail, interview, document, note, shift
  } = req.body;

  try {
    const sql = `
      INSERT INTO job_portal.companies
      (company, image, type, address, age, salary, bonus, detail, interview, document, note, shift)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      company, image, type, address, age, salary, bonus,
      detail, interview, document, note, shift
    ]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("❌ Lỗi khi thêm công ty:", err);
    sendError(res, 500, "Insert failed");
  }
});

app.put("/api/admin/companies/:id", async (req, res) => {
  const { id } = req.params;
  const {
    company, image, type, address, age, salary, bonus,
    detail, interview, document, note, shift
  } = req.body;

  try {
    const sql = `
      UPDATE job_portal.companies SET
        company=?, image=?, type=?, address=?, age=?, salary=?, bonus=?, detail=?, interview=?, document=?, note=?, shift=?
      WHERE id=?
    `;
    await db.query(sql, [
      company, image, type, address, age, salary, bonus,
      detail, interview, document, note, shift, id
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật công ty:", err);
    sendError(res, 500, "Update failed");
  }
});

app.delete("/api/admin/companies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM job_portal.companies WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi xóa công ty:", err);
    sendError(res, 500, "Delete failed");
  }
});

// ===================== STATIC FILE SERVING =====================
app.use(express.static(path.join(__dirname, "../frontend")));

// ===================== START SERVER =====================
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server đang chạy tại http://localhost:${PORT}`));
