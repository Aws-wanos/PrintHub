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

// Multer setup with error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Product creation route
app.post("/api/admin/products", upload.single("image"), (req, res) => {
  console.log("Product creation request received");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    const { name, description, price, stock, category } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!name || !price || !stock) {
      return res
        .status(400)
        .json({ error: "Name, price, and stock are required" });
    }

    const query =
      "INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      query,
      [name, description, price, stock, category, image_url],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json({
          message: "Product added successfully",
          id: result.insertId,
        });
      },
    );
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: error.message });
  }
});
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
// Get pending reviews
app.get("/api/admin/reviews/pending", (req, res) => {
  db.query(
    'SELECT r.*, p.name as product_name FROM reviews r JOIN products p ON r.product_id = p.id WHERE r.status = "pending" ORDER BY r.created_at DESC',
    (err, results) => {
      if (err) {
        console.error("Error fetching pending reviews:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    },
  );
});

// Get all reviews
app.get("/api/admin/reviews", (req, res) => {
  db.query(
    "SELECT r.*, p.name as product_name FROM reviews r JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching reviews:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    },
  );
});

// Approve review
app.put("/api/admin/reviews/:id/approve", (req, res) => {
  const reviewId = req.params.id;

  db.query(
    'UPDATE reviews SET status = "approved" WHERE id = ?',
    [reviewId],
    (err) => {
      if (err) {
        console.error("Error approving review:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Review approved successfully" });
    },
  );
});

// Delete review
app.delete("/api/admin/reviews/:id", (req, res) => {
  const reviewId = req.params.id;

  db.query("DELETE FROM reviews WHERE id = ?", [reviewId], (err) => {
    if (err) {
      console.error("Error deleting review:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Review deleted successfully" });
  });
});

// Admin routes
app.post("/api/admin/products", upload.single("image"), (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    console.log("Saving product:", { name, price, stock, category, image_url });
    console.log("File:", req.file);

    const query =
      "INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      query,
      [name, description, price, stock, category, image_url],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json({
          message: "Product added successfully",
          id: result.insertId,
        });
      },
    );
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/products/:id", (req, res) => {
  db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product deleted" });
  });
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
app.put("/api/admin/orders/:id", (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  console.log("Updating order:", orderId, "Status:", status);

  // Validate status
  const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, orderId],
    (err, result) => {
      if (err) {
        console.error("Error updating order:", err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ message: "Order updated successfully" });
    },
  );
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
app.post("/api/test-upload", upload.single("image"), (req, res) => {
  console.log("Test upload received");
  console.log("File:", req.file);
  console.log("Body:", req.body);
  res.json({
    message: "Upload test successful",
    file: req.file,
    body: req.body,
  });
});
