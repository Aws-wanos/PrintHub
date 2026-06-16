const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Uploads folder
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Database connection
const db = mysql.createPool({
  host: "09dab9b5246068e673db42f7.twc1.net",
  user: "gen_user",
  password: "p+o6|t->L=0De2",
  database: "default_db",
  port: 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection error:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
  connection.release();
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// ============ ROUTES ============

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is alive!", time: new Date().toISOString() });
});

// Products
app.get("/api/products", (req, res) => {
  db.query(
    "SELECT * FROM products ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.get("/api/products/:id", (req, res) => {
  db.query(
    "SELECT * FROM products WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || null);
    },
  );
});

// Reviews
app.get("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  db.query(
    'SELECT * FROM reviews WHERE product_id = ? AND status = "approved" ORDER BY created_at DESC',
    [productId],
    (err, results) => {
      if (err) {
        console.error("Reviews error:", err);
        return res.json([]);
      }
      res.json(results || []);
    },
  );
});

app.post("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  const { customer_name, rating, comment } = req.body;

  if (!customer_name || !rating || !comment) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.query(
    'INSERT INTO reviews (product_id, customer_name, rating, comment, status) VALUES (?, ?, ?, ?, "pending")',
    [productId, customer_name, rating, comment],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Review submitted!", id: result.insertId });
    },
  );
});

// Admin routes
app.post("/api/admin/products", upload.single("image"), (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)",
    [name, description, price, stock, category, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product added", id: result.insertId });
    },
  );
});

app.delete("/api/admin/products/:id", (req, res) => {
  db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product deleted" });
  });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM admins WHERE username = ?",
    [username],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      bcrypt.compare(password, results[0].password, (err, isMatch) => {
        if (err || !isMatch) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({ message: "Login successful", adminId: results[0].id });
      });
    },
  );
});

// Orders
app.post("/api/orders", (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_address,
    items,
    total_amount,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      "INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount) VALUES (?, ?, ?, ?)",
      [customer_name, customer_phone, customer_address, total_amount],
      (err, result) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ error: err.message }),
          );
        }

        const orderId = result.insertId;
        const orderItems = items.map((item) => [
          orderId,
          item.id,
          item.quantity,
          item.price,
        ]);

        db.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
          [orderItems],
          (err) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ error: err.message }),
              );
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() =>
                  res.status(500).json({ error: err.message }),
                );
              }
              res.json({ message: "Order created", orderId });
            });
          },
        );
      },
    );
  });
});

app.get("/api/admin/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY order_date DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Contact messages
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  db.query(
    "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
    [name, email, phone, message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message sent", id: result.insertId });
    },
  );
});

app.get("/api/admin/contacts", (req, res) => {
  db.query(
    "SELECT * FROM contact_messages ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

// 404 handler for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
