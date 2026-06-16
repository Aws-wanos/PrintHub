import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://aws-wanos-printhub-d2ce.twc1.net/api";

function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: null,
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      fetchOrders();
      fetchMessages();
      fetchPendingReviews();
      fetchAllReviews();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        username,
        password,
      });
      if (response.data.message === "Login successful") {
        setIsLoggedIn(true);
      }
    } catch (error) {
      alert("Invalid username or password");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/contacts`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/reviews/pending`);
      setPendingReviews(response.data);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
    }
  };

  const fetchAllReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/reviews`);
      setAllReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("category", formData.category);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      if (editingProduct) {
        await axios.put(
          `${API_URL}/admin/products/${editingProduct.id}`,
          formDataToSend,
        );
        alert("Product updated successfully!");
      } else {
        await axios.post(`${API_URL}/admin/products`, formDataToSend);
        alert("Product added successfully!");
      }
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product");
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_URL}/admin/products/${id}`);
        fetchProducts();
        alert("Product deleted successfully!");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product");
      }
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${id}`, { status });
      fetchOrders();
      alert("Order status updated!");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order");
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/admin/contacts/${id}`, { status });
      fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const deleteMessage = async (id) => {
    if (window.confirm("Delete this message?")) {
      try {
        await axios.delete(`${API_URL}/admin/contacts/${id}`);
        fetchMessages();
        alert("Message deleted!");
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Error deleting message");
      }
    }
  };

  const approveReview = async (id) => {
    try {
      await axios.put(`${API_URL}/admin/reviews/${id}/approve`);
      fetchPendingReviews();
      fetchAllReviews();
      alert("Review approved!");
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Error approving review");
    }
  };

  const deleteReview = async (id) => {
    if (window.confirm("Delete this review?")) {
      try {
        await axios.delete(`${API_URL}/admin/reviews/${id}`);
        fetchPendingReviews();
        fetchAllReviews();
        alert("Review deleted!");
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Error deleting review");
      }
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      image: null,
    });
    const fileInput = document.getElementById("product-image");
    if (fileInput) fileInput.value = "";
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category: product.category || "",
      image: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "#ff9800",
      confirmed: "#4CAF50",
      delivered: "#2196F3",
      cancelled: "#f44336",
    };
    return colorMap[status] || "#999";
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              autoFocus
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
            />
            <button type="submit">Login</button>
          </form>
          <p className="login-hint">Default: admin / admin123</p>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => setIsLoggedIn(false)} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={activeTab === "products" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("products")}
        >
          📦 Products ({products.length})
        </button>
        <button
          className={activeTab === "orders" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("orders")}
        >
          🛒 Orders ({orders.length})
        </button>
        <button
          className={activeTab === "messages" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("messages")}
        >
          💬 Messages ({unreadCount} unread)
        </button>
        <button
          className={activeTab === "reviews" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("reviews")}
        >
          ⭐ Reviews ({pendingReviews.length} pending)
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <>
          <div className="admin-section">
            <h2>{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    placeholder="Product name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="Category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₽) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Product description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                />
                {editingProduct && editingProduct.image_url && (
                  <div className="current-image">
                    <small>Current image:</small>
                    <img
                      src={`http://localhost:5000${editingProduct.image_url}`}
                      alt={editingProduct.name}
                      style={{ maxWidth: "100px", marginTop: "10px" }}
                    />
                  </div>
                )}
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-btn"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-section">
            <h2>📋 Product List</h2>
            {products.length === 0 ? (
              <p>No products yet. Add your first product above!</p>
            ) : (
              <div className="products-table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          {product.image_url ? (
                            <img
                              src={`http://localhost:5000${product.image_url}`}
                              alt={product.name}
                              className="product-thumb"
                            />
                          ) : (
                            <div className="no-image">No image</div>
                          )}
                        </td>
                        <td>{product.name}</td>
                        <td>{product.category || "-"}</td>
                        <td>{product.price} ₽</td>
                        <td>
                          <span
                            className={`stock-badge ${product.stock <= 5 ? "low-stock" : ""}`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => editProduct(product)}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="admin-section">
          <h2>📦 Orders Management</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.id}</h3>
                      <span className="order-date">
                        {new Date(order.order_date).toLocaleString()}
                      </span>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
                      style={{
                        backgroundColor: getStatusColor(order.status),
                        color: "white",
                      }}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="order-body">
                    <div className="customer-info">
                      <p>
                        <strong>Customer:</strong> {order.customer_name}
                      </p>
                      <p>
                        <strong>Phone:</strong> {order.customer_phone}
                      </p>
                      <p>
                        <strong>Address:</strong> {order.customer_address}
                      </p>
                    </div>
                    <div className="order-total">
                      <strong>Total:</strong> {order.total_amount} ₽
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="admin-section">
          <h2>💬 Contact Messages</h2>
          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-card ${message.status}`}
                >
                  <div className="message-header">
                    <div>
                      <strong>{message.name}</strong>
                      <span className="message-email">📧 {message.email}</span>
                      {message.phone && (
                        <span className="message-phone">
                          📞 {message.phone}
                        </span>
                      )}
                    </div>
                    <span className="message-date">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="message-content">
                    <p>{message.message}</p>
                  </div>
                  <div className="message-actions">
                    <select
                      value={message.status}
                      onChange={(e) =>
                        updateMessageStatus(message.id, e.target.value)
                      }
                    >
                      <option value="unread">📖 Unread</option>
                      <option value="read">✓ Read</option>
                      <option value="replied">✉️ Replied</option>
                    </select>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="delete-message-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div className="admin-section">
          <h2>⭐ Pending Reviews ({pendingReviews.length})</h2>
          {pendingReviews.length === 0 ? (
            <p>No pending reviews.</p>
          ) : (
            pendingReviews.map((review) => (
              <div key={review.id} className="review-admin-card">
                <div className="review-admin-header">
                  <strong>{review.customer_name}</strong>
                  <span>Rating: {renderStars(review.rating)}</span>
                  <span>Product: {review.product_name}</span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p>{review.comment}</p>
                <div className="review-admin-actions">
                  <button
                    onClick={() => approveReview(review.id)}
                    className="approve-btn"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="delete-review-btn"
                  >
                    ✗ Delete
                  </button>
                </div>
              </div>
            ))
          )}

          <h2 style={{ marginTop: "30px" }}>📋 All Reviews</h2>
          {allReviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            allReviews.map((review) => (
              <div key={review.id} className="review-admin-card">
                <div className="review-admin-header">
                  <strong>{review.customer_name}</strong>
                  <span>Rating: {renderStars(review.rating)}</span>
                  <span>Product: {review.product_name}</span>
                  <span className={`review-status ${review.status}`}>
                    Status: {review.status}
                  </span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p>{review.comment}</p>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="delete-review-btn"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
