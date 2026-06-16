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

// Create uploads folder
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Database connection with better error handling
let db;
try {
  db = mysql.createConnection({
    host: "09dab9b5246068e673db42f7.twc1.net",
    user: "gen_user",
    password: "p+o6|t->L=0De2",
    database: "default_db",
    port: 3306,
    ssl: {
      rejectUnauthorized: false,
    },
    connectTimeout: 10000,
  });

  db.connect((err) => {
    if (err) {
      console.error("Database connection error:", err.message);
      // Don't crash the server if DB fails
    } else {
      console.log("Connected to MySQL database");
    }
  });
} catch (err) {
  console.error("Database setup error:", err.message);
}

// Test endpoint - always works even if DB is down
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is alive!",
    time: new Date().toISOString(),
    db_connected: db ? true : false,
  });
});

// Products endpoint with error handling
app.get("/api/products", (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not connected" });
  }
  db.query(
    "SELECT * FROM products ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        console.error("Products query error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results || []);
    },
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
