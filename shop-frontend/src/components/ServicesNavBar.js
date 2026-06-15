import React from "react";
import { Link, useLocation } from "react-router-dom";

function ServicesNavBar() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("category") || "all";

  const services = [
    { id: "all", name: "Все услуги", icon: "🏠", path: "/?category=all" },
    {
      id: "t-shirts",
      name: "Футболки",
      icon: "👕",
      path: "/?category=t-shirts",
    },
    { id: "mugs", name: "Кружки", icon: "☕", path: "/?category=mugs" },
    { id: "shoppers", name: "Шоперы", icon: "🛍️", path: "/?category=shoppers" },
    { id: "pillows", name: "Подушки", icon: "🛏️", path: "/?category=pillows" },
  ];

  return (
    <div className="services-navbar">
      <div className="services-navbar-container">
        {services.map((service) => (
          <Link
            key={service.id}
            to={service.path}
            className={`service-nav-link ${currentCategory === service.id ? "active" : ""}`}
          >
            <span className="service-icon">{service.icon}</span>
            <span className="service-name">{service.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ServicesNavBar;
