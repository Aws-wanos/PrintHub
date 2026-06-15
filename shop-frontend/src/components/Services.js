import React from "react";
import "./Services.css";

function Services() {
  const services = [
    {
      id: 1,
      name: "Печать на футболках",
      description: "Качественная печать на футболках любых размеров",
      icon: "👕",
      price: "от 500 ₽",
    },
    {
      id: 2,
      name: "Печать на кружках",
      description: "Яркая печать на керамических кружках",
      icon: "☕",
      price: "от 300 ₽",
    },
    {
      id: 3,
      name: "Печать на шоперах",
      description: "Экологичные сумки шоперы с вашим дизайном",
      icon: "🛍️",
      price: "от 400 ₽",
    },
    {
      id: 4,
      name: "Печать на подушках",
      description: "Мягкие подушки с фотопечатью",
      icon: "🛏️",
      price: "от 600 ₽",
    },
  ];

  return (
    <div className="services-section">
      <h2>Наши услуги</h2>
      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <p className="service-price">{service.price}</p>
            <button
              className="service-btn"
              onClick={() => (window.location.href = "/contact")}
            >
              Заказать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Services;
