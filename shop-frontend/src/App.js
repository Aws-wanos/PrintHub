import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import ProductsPage from "./components/ProductsPage";
import AdminPanel from "./components/AdminPanel";
import Cart from "./components/Cart";
import SEO from "./components/SEO";
import "./App.css";

// Services Navigation Component
function ServicesNavBar({ selectedCategory, setSelectedCategory }) {
  const location = useLocation();

  const isAdminPage = location.pathname === "/admin";
  const isCartPage = location.pathname === "/cart";

  if (isAdminPage || isCartPage) {
    return null;
  }

  const services = [
    { id: "all", name: "Все услуги", icon: "🏠" },
    { id: "t-shirts", name: "Футболки", icon: "👕" },
    { id: "mugs", name: "Кружки", icon: "☕" },
    { id: "shoppers", name: "Шоперы", icon: "🛍️" },
    { id: "pillows", name: "Подушки", icon: "🛏️" },
  ];

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const url = new URL(window.location);
    if (categoryId === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", categoryId);
    }
    window.history.pushState({}, "", url);
  };

  return (
    <div className="services-navbar">
      <div className="services-navbar-container">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleCategoryChange(service.id)}
            className={`service-nav-link ${selectedCategory === service.id ? "active" : ""}`}
          >
            <span className="service-icon">{service.icon}</span>
            <span className="service-name">{service.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Custom Order Banner Component
function CustomOrderBanner() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";
  const isCartPage = location.pathname === "/cart";

  if (isAdminPage || isCartPage) {
    return null;
  }

  return (
    <div className="custom-order-banner">
      <div className="banner-content">
        <span className="banner-icon">🎨</span>
        <span className="banner-text">
          Вы можете заказать индивидуальный дизайн!
        </span>
        <span className="banner-contact">
          📱 Telegram: @Printhub12 | WhatsApp: +79112057766 | Email:
          aws.wanos.98@gmail.com
        </span>
      </div>
    </div>
  );
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const contactOptions = [
    {
      name: "Telegram",
      icon: "📱",
      url: "https://t.me/Printhub12",
      color: "#0088cc",
    },
    {
      name: "WhatsApp",
      icon: "💬",
      url: "https://wa.me/79112057766",
      color: "#25D366",
    },
    {
      name: "Email",
      icon: "✉️",
      url: "mailto:aws.wanos.98@gmail.com",
      color: "#ea4335",
    },
  ];

  return (
    <Router>
      <div className="App">
        <SEO
          title="PrintHub Moscow - Качественная печать на одежде и аксессуарах в Москве"
          description="Печать на футболках, кружках, шоперах и подушках в Москве. Индивидуальный дизайн. Быстрая доставка по Москве и России. Закажите сейчас!"
          keywords="печать на футболках Москва, печать на кружках Москва, печать на шоперах Москва, печать на подушках Москва, сувенирная продукция Москва, printhub moscow"
        />

        {/* Main Navigation Bar */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              🖨️ PrintHub Moscow
            </Link>
            <div className="nav-links">
              <Link to="/">Товары</Link>
              <Link to="/cart">Корзина 🛒</Link>

              {/* Contact Dropdown */}
              <div
                className="dropdown"
                onMouseLeave={() => setShowContactDropdown(false)}
              >
                <button
                  className="dropdown-btn"
                  onMouseEnter={() => setShowContactDropdown(true)}
                >
                  Контакты ▼
                </button>
                {showContactDropdown && (
                  <div className="dropdown-content">
                    {contactOptions.map((option, index) => (
                      <a
                        key={index}
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dropdown-item"
                        style={{ "--hover-color": option.color }}
                      >
                        <span className="dropdown-icon">{option.icon}</span>
                        <span>{option.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Services Navigation Bar */}
        <ServicesNavBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Custom Order Banner */}
        <CustomOrderBanner />

        <Routes>
          <Route
            path="/"
            element={
              <ProductsPage
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            }
          />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
