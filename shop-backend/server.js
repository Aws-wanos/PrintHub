const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint - no database needed
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", time: new Date().toISOString() });
});

// Products endpoint with mock data for testing
app.get("/api/products", (req, res) => {
  res.json([
    { id: 1, name: "Test Product 1", price: 1000, stock: 10 },
    { id: 2, name: "Test Product 2", price: 2000, stock: 5 },
  ]);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
