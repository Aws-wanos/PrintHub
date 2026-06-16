import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Reviews from "./Reviews";

const API_URL = "https://aws-wanos-printhub-d2ce.twc1.net/api";
const BASE_URL = API_URL.replace("/api", "");

function ProductsPage({ selectedCategory, setSelectedCategory }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
  });

  // Category mapping
  const categoryMap = {
    all: "Все товары",
    "t-shirts": "Футболки",
    mugs: "Кружки",
    shoppers: "Шоперы",
    pillows: "Подушки",
  };

  // Get category from URL
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
  }, [searchParams, selectedCategory, setSelectedCategory]);

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  // SAFE filter products when category changes
  useEffect(() => {
    if (!products || products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) => {
        // Skip if product doesn't exist or has no category
        if (!product || !product.category) {
          return false;
        }
        // Safe comparison
        const productCategory = String(product.category).toLowerCase();
        const selectedCat = String(selectedCategory).toLowerCase();
        return productCategory === selectedCat;
      });
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      // Ensure all products have a category field
      const productsWithDefaultCategory = response.data.map((product) => ({
        ...product,
        category: product.category || "all",
        avg_rating: product.avg_rating || 0,
        total_reviews: product.total_reviews || 0,
      }));
      setProducts(productsWithDefaultCategory);
      setFilteredProducts(productsWithDefaultCategory);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = (product) => {
    if (!product) return;

    const existingItem = cart.find((item) => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity >= product.stock) {
      alert(`Извините, в наличии только ${product.stock} шт.`);
      return;
    }

    let newCart;
    if (existingItem) {
      newCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    alert("Товар добавлен в корзину!");
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => item.id !== productId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Извините, в наличии только ${product.stock} шт.`);
      return;
    }

    const newCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item,
    );
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const checkout = () => {
    if (cart.length === 0) {
      alert("Корзина пуста!");
      return;
    }
    setShowOrderForm(true);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (cart.length === 0) {
      alert("Корзина пуста!");
      setShowOrderForm(false);
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      customer_name: orderForm.customer_name,
      customer_phone: orderForm.customer_phone,
      customer_address: orderForm.customer_address,
      items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      total_amount: cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    };

    try {
      await axios.post(`${API_URL}/orders`, orderData);
      alert("Заказ успешно оформлен! С вами свяжутся.");
      localStorage.removeItem("cart");
      setCart([]);
      setShowOrderForm(false);
      setOrderForm({
        customer_name: "",
        customer_phone: "",
        customer_address: "",
      });
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Ошибка при оформлении заказа. Пожалуйста, попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCartTotal = () => {
    return cart.reduce(
      (sum, item) => sum + (item.price * item.quantity || 0),
      0,
    );
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const getCategoryTitle = () => {
    return categoryMap[selectedCategory] || "Все товары";
  };

  const getDisplayCategory = (category) => {
    if (!category) return "Общее";
    const categoryNames = {
      "t-shirts": "Футболки",
      mugs: "Кружки",
      shoppers: "Шоперы",
      pillows: "Подушки",
      all: "Все товары",
    };
    return categoryNames[category] || category;
  };

  // Helper function to render stars
  const renderStars = (rating) => {
    const fullStars = Math.round(rating);
    return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  };

  return (
    <div className="products-container">
      <div className="category-header">
        <h1>{getCategoryTitle()}</h1>
        <p className="category-count">
          Найдено: {filteredProducts.length} товаров
        </p>
      </div>

      {!filteredProducts || filteredProducts.length === 0 ? (
        <div className="no-products">
          <p>В этой категории пока нет товаров</p>
          <button
            onClick={() => setSelectedCategory("all")}
            className="view-all-btn"
          >
            Посмотреть все товары
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              {product.image_url && (
                <img
                  src={`https://aws-wanos-printhub-d2ce.twc1.net${product.image_url}`}
                  alt={product.name}
                  className="product-image"
                />
              )}
              <div className="product-category-badge">
                {getDisplayCategory(product.category)}
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="price">{product.price} ₽</p>
              <p className="stock">В наличии: {product.stock} шт.</p>

              {/* Display rating if exists */}
              {product.avg_rating > 0 && (
                <div className="product-rating">
                  <span className="rating-stars">
                    {renderStars(product.avg_rating)}
                  </span>
                  <span className="rating-count">
                    ({product.total_reviews} отзывов)
                  </span>
                </div>
              )}

              <button
                onClick={() => addToCart(product)}
                className="add-to-cart-btn"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? "Нет в наличии" : "В корзину"}
              </button>

              {/* Reviews Component - This was missing */}
              <Reviews productId={product.id} />
            </div>
          ))}
        </div>
      )}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="cart-summary">
          <h3>Корзина ({getCartItemCount()} товаров)</h3>
          <div className="cart-items-summary">
            {cart.map((item) => (
              <div key={item.id} className="cart-item-summary">
                <span className="cart-item-name">{item.name}</span>
                <div className="cart-item-controls">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <span className="item-total">
                    {item.price * item.quantity} ₽
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="remove-item"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total-summary">
            <p>Итого: {getCartTotal()} ₽</p>
            <button onClick={checkout} className="checkout-btn">
              Оформить заказ
            </button>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Оформление заказа</h2>
            <div className="order-summary">
              <h3>Ваш заказ:</h3>
              {cart.map((item) => (
                <div key={item.id} className="order-item">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{item.price * item.quantity} ₽</span>
                </div>
              ))}
              <div className="order-total">
                <strong>Итого: {getCartTotal()} ₽</strong>
              </div>
            </div>

            <form onSubmit={submitOrder}>
              <input
                type="text"
                placeholder="Ваше имя *"
                value={orderForm.customer_name}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, customer_name: e.target.value })
                }
                required
              />
              <input
                type="tel"
                placeholder="Телефон *"
                value={orderForm.customer_phone}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, customer_phone: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Адрес доставки *"
                value={orderForm.customer_address}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    customer_address: e.target.value,
                  })
                }
                required
              />
              <div className="form-buttons">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Оформление..." : "Подтвердить заказ"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="cancel-btn"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
