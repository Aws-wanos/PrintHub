import React, { useState } from "react";
import axios from "axios";
import "./ContactUs.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/contact",
        formData,
      );
      console.log("Message sent:", response.data);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(true);
      setTimeout(() => setError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>Свяжитесь с нами</h1>
        <p>Мы всегда рады помочь вам с выбором и ответить на вопросы</p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <div className="info-card">
            <div className="info-icon">📍</div>
            <h3>Адрес</h3>
            <p>г. Москва, ул. Тверская, д. 15</p>
          </div>

          <div className="info-card">
            <div className="info-icon">📞</div>
            <h3>Телефон</h3>
            <p>+7 (999) 123-45-67</p>
            <p>+7 (888) 765-43-21</p>
          </div>

          <div className="info-card">
            <div className="info-icon">✉️</div>
            <h3>Email</h3>
            <p>info@russianshop.ru</p>
            <p>orders@russianshop.ru</p>
          </div>

          <div className="info-card">
            <div className="info-icon">🕐</div>
            <h3>Режим работы</h3>
            <p>Пн-Пт: 10:00 - 20:00</p>
            <p>Сб-Вс: 11:00 - 18:00</p>
          </div>
        </div>

        <div className="contact-form">
          <h2>Напишите нам</h2>
          {submitted && (
            <div className="success-message">
              ✅ Спасибо! Мы свяжемся с вами в ближайшее время.
            </div>
          )}
          {error && (
            <div className="error-message">
              ❌ Ошибка! Пожалуйста, попробуйте позже.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Ваше имя *"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Телефон"
              value={formData.phone}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="Ваше сообщение *"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button type="submit" disabled={loading}>
              {loading ? "Отправка..." : "Отправить"}
            </button>
          </form>
        </div>
      </div>

      <div className="map-container">
        <iframe
          title="map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2244.123456789!2d37.617634!3d55.755826!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTXCsDQ1JzIxLjAiTiAzN8KwMzcnMDMuNSJF!5e0!3m2!1sen!2sru!4v1234567890"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}

export default ContactUs;
