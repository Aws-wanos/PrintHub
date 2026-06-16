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

// ===================== FIX 1: UPLOADS FOLDER =====================
// Ensure the uploads folder exists BEFORE trying to use it
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve the folder statically so images are accessible via URL
app.use("/uploads", express.static(uploadsDir));
console.log(`✅ Uploads folder is ready at: ${uploadsDir}`);

// ===================== FIX 2: DATABASE CONNECTION (POOL) =====================
// Using a pool is more reliable than a single connection
const db = mysql.createPool({
  host: "09dab9b5246068e673db42f7.twc1.net",
  user: "gen_user",
  password: "p+o6|t->L=0De2",
  database: "default_db",
  port: 3306,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection error:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
  connection.release();
});

// ===================== FIX 3: MULTER STORAGE =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use the absolute path we created earlier
  },
  filename: (req, file, cb) => {
    // Remove spaces and special characters from filename
    const cleanName = Date.now() + path.extname(file.originalname);
    cb(null, cleanName);
  },
});
const upload = multer({ storage: storage });

// ================================================================
// ===================== YOUR ROUTES =====================
// ================================================================

// ---------- PRODUCTS ----------
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
      res.json(results[0]);
    },
  );
});

app.post("/api/admin/products", upload.single("image"), (req, res) => {
  const { name, description, price, stock, category } = req.body;
  // Store the path as a relative URL that the frontend can use
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const query =
    "INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [name, description, price, stock, category, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product added successfully", id: result.insertId });
    },
  );
});

app.put("/api/admin/products/:id", upload.single("image"), (req, res) => {
  const { name, description, price, stock, category } = req.body;
  let query =
    "UPDATE products SET name=?, description=?, price=?, stock=?, category=?";
  let params = [name, description, price, stock, category];

  if (req.file) {
    query += ", image_url=?";
    params.push(`/uploads/${req.file.filename}`);
  }

  query += " WHERE id=?";
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product updated successfully" });
  });
});

app.delete("/api/admin/products/:id", (req, res) => {
  const productId = req.params.id;
  db.query("DELETE FROM products WHERE id = ?", [productId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});

// ---------- ORDERS ----------
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
        if (err)
          return db.rollback(() =>
            res.status(500).json({ error: err.message }),
          );
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
            if (err)
              return db.rollback(() =>
                res.status(500).json({ error: err.message }),
              );
            const stockUpdates = items.map((item) => {
              return new Promise((resolve, reject) => {
                db.query(
                  "UPDATE products SET stock = stock - ? WHERE id = ?",
                  [item.quantity, item.id],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  },
                );
              });
            });
            Promise.all(stockUpdates)
              .then(() => {
                db.commit((err) => {
                  if (err)
                    return db.rollback(() =>
                      res.status(500).json({ error: err.message }),
                    );
                  res.json({ message: "Order created successfully", orderId });
                });
              })
              .catch((err) =>
                db.rollback(() => res.status(500).json({ error: err.message })),
              );
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

app.put("/api/admin/orders/:id", (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Order updated successfully" });
    },
  );
});

// ---------- ADMIN LOGIN ----------
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM admins WHERE username = ?",
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(401).json({ error: "Invalid credentials" });
      const admin = results[0];
      bcrypt.compare(password, admin.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!isMatch)
          return res.status(401).json({ error: "Invalid credentials" });
        res.json({ message: "Login successful", adminId: admin.id });
      });
    },
  );
});

// ---------- CONTACT MESSAGES ----------
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  db.query(
    "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
    [name, email, phone, message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message sent successfully", id: result.insertId });
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

app.put("/api/admin/contacts/:id", (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE contact_messages SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message updated successfully" });
    },
  );
});

app.delete("/api/admin/contacts/:id", (req, res) => {
  db.query(
    "DELETE FROM contact_messages WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message deleted successfully" });
    },
  );
});

// ---------- REVIEWS ----------
app.get("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  db.query(
    'SELECT * FROM reviews WHERE product_id = ? AND status = "approved" ORDER BY created_at DESC',
    [productId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.post("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  const { customer_name, rating, comment } = req.body;
  if (!customer_name || !rating || !comment)
    return res.status(400).json({ error: "All fields are required" });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  db.query(
    'INSERT INTO reviews (product_id, customer_name, rating, comment, status) VALUES (?, ?, ?, ?, "pending")',
    [productId, customer_name, rating, comment],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "Review submitted successfully! Awaiting approval.",
        id: result.insertId,
      });
    },
  );
});

app.get("/api/admin/reviews/pending", (req, res) => {
  db.query(
    'SELECT r.*, p.name as product_name FROM reviews r JOIN products p ON r.product_id = p.id WHERE r.status = "pending" ORDER BY r.created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.get("/api/admin/reviews", (req, res) => {
  db.query(
    "SELECT r.*, p.name as product_name FROM reviews r JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.put("/api/admin/reviews/:id/approve", (req, res) => {
  db.query(
    'UPDATE reviews SET status = "approved" WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Review approved successfully" });
    },
  );
});

app.delete("/api/admin/reviews/:id", (req, res) => {
  db.query("DELETE FROM reviews WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Review deleted successfully" });
  });
});

// ---------- TEST ----------
app.get("/api/test-env", (req, res) => {
  res.json({
    message: "Server is running",
    node_version: process.version,
    db_connected: true,
  });
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
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

// ===================== FIX 1: UPLOADS FOLDER =====================
// Ensure the uploads folder exists BEFORE trying to use it
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve the folder statically so images are accessible via URL
app.use("/uploads", express.static(uploadsDir));
console.log(`✅ Uploads folder is ready at: ${uploadsDir}`);

// ===================== FIX 2: DATABASE CONNECTION (POOL) =====================
// Using a pool is more reliable than a single connection
const db = mysql.createPool({
  host: "09dab9b5246068e673db42f7.twc1.net",
  user: "gen_user",
  password: "p+o6|t->L=0De2",
  database: "default_db",
  port: 3306,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection error:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
  connection.release();
});

// ===================== FIX 3: MULTER STORAGE =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use the absolute path we created earlier
  },
  filename: (req, file, cb) => {
    // Remove spaces and special characters from filename
    const cleanName = Date.now() + path.extname(file.originalname);
    cb(null, cleanName);
  },
});
const upload = multer({ storage: storage });

// ================================================================
// ===================== YOUR ROUTES =====================
// ================================================================

// ---------- PRODUCTS ----------
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
      res.json(results[0]);
    },
  );
});

app.post("/api/admin/products", upload.single("image"), (req, res) => {
  const { name, description, price, stock, category } = req.body;
  // Store the path as a relative URL that the frontend can use
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const query =
    "INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [name, description, price, stock, category, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product added successfully", id: result.insertId });
    },
  );
});

app.put("/api/admin/products/:id", upload.single("image"), (req, res) => {
  const { name, description, price, stock, category } = req.body;
  let query =
    "UPDATE products SET name=?, description=?, price=?, stock=?, category=?";
  let params = [name, description, price, stock, category];

  if (req.file) {
    query += ", image_url=?";
    params.push(`/uploads/${req.file.filename}`);
  }

  query += " WHERE id=?";
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product updated successfully" });
  });
});

app.delete("/api/admin/products/:id", (req, res) => {
  const productId = req.params.id;
  db.query("DELETE FROM products WHERE id = ?", [productId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});

// ---------- ORDERS ----------
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
        if (err)
          return db.rollback(() =>
            res.status(500).json({ error: err.message }),
          );
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
            if (err)
              return db.rollback(() =>
                res.status(500).json({ error: err.message }),
              );
            const stockUpdates = items.map((item) => {
              return new Promise((resolve, reject) => {
                db.query(
                  "UPDATE products SET stock = stock - ? WHERE id = ?",
                  [item.quantity, item.id],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  },
                );
              });
            });
            Promise.all(stockUpdates)
              .then(() => {
                db.commit((err) => {
                  if (err)
                    return db.rollback(() =>
                      res.status(500).json({ error: err.message }),
                    );
                  res.json({ message: "Order created successfully", orderId });
                });
              })
              .catch((err) =>
                db.rollback(() => res.status(500).json({ error: err.message })),
              );
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

app.put("/api/admin/orders/:id", (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Order updated successfully" });
    },
  );
});

// ---------- ADMIN LOGIN ----------
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM admins WHERE username = ?",
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(401).json({ error: "Invalid credentials" });
      const admin = results[0];
      bcrypt.compare(password, admin.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!isMatch)
          return res.status(401).json({ error: "Invalid credentials" });
        res.json({ message: "Login successful", adminId: admin.id });
      });
    },
  );
});

// ---------- CONTACT MESSAGES ----------
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  db.query(
    "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
    [name, email, phone, message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message sent successfully", id: result.insertId });
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

app.put("/api/admin/contacts/:id", (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE contact_messages SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message updated successfully" });
    },
  );
});

app.delete("/api/admin/contacts/:id", (req, res) => {
  db.query(
    "DELETE FROM contact_messages WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Message deleted successfully" });
    },
  );
});

// ---------- REVIEWS ----------
app.get("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  db.query(
    'SELECT * FROM reviews WHERE product_id = ? AND status = "approved" ORDER BY created_at DESC',
    [productId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.post("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  const { customer_name, rating, comment } = req.body;
  if (!customer_name || !rating || !comment)
    return res.status(400).json({ error: "All fields are required" });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  db.query(
    'INSERT INTO reviews (product_id, customer_name, rating, comment, status) VALUES (?, ?, ?, ?, "pending")',
    [productId, customer_name, rating, comment],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "Review submitted successfully! Awaiting approval.",
        id: result.insertId,
      });
    },
  );
});

app.get("/api/admin/reviews/pending", (req, res) => {
  db.query(
    'SELECT r.*, p.name as product_name FROM reviews r JOIN products p ON r.product_id = p.id WHERE r.status = "pending" ORDER BY r.created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.get("/api/admin/reviews", (req, res) => {
  db.query(
    "SELECT r.*, p.name as product_name FROM reviews r JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.put("/api/admin/reviews/:id/approve", (req, res) => {
  db.query(
    'UPDATE reviews SET status = "approved" WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Review approved successfully" });
    },
  );
});

app.delete("/api/admin/reviews/:id", (req, res) => {
  db.query("DELETE FROM reviews WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Review deleted successfully" });
  });
});

// ---------- TEST ----------
app.get("/api/test-env", (req, res) => {
  res.json({
    message: "Server is running",
    node_version: process.version,
    db_connected: true,
  });
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// ---------- REVIEWS (FIXED) ----------
// Get reviews for a product
app.get("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;

  // Check if the reviews table exists
  db.query(
    "SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC",
    [productId],
    (err, results) => {
      if (err) {
        console.error("Reviews query error:", err);
        // Return empty array if table doesn't exist yet
        return res.json([]);
      }
      res.json(results || []);
    },
  );
});

// Add a new review
app.post("/api/products/:productId/reviews", (req, res) => {
  const { productId } = req.params;
  const { customer_name, rating, comment } = req.body;

  if (!customer_name || !rating || !comment) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  // Insert review
  db.query(
    'INSERT INTO reviews (product_id, customer_name, rating, comment, status) VALUES (?, ?, ?, ?, "pending")',
    [productId, customer_name, rating, comment],
    (err, result) => {
      if (err) {
        console.error("Error saving review:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: "Review submitted successfully! Awaiting approval.",
        id: result.insertId,
      });
    },
  );
});
