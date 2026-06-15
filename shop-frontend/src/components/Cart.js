import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const updateQuantity = (productId, change) => {
    const newCart = cart
      .map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity > 0) {
            return { ...item, quantity: newQuantity };
          }
          return null;
        }
        return item;
      })
      .filter((item) => item !== null);

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeItem = (productId) => {
    const newCart = cart.filter((item) => item.id !== productId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const checkout = () => {
    if (cart.length > 0) {
      navigate("/");
      setTimeout(() => {
        const orderEvent = new CustomEvent("checkout");
        window.dispatchEvent(orderEvent);
      }, 100);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Корзина пуста</h2>
        <button onClick={() => navigate("/")}>Перейти к покупкам</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Корзина</h1>
      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <div className="cart-item-info">
            <h3>{item.name}</h3>
            <p>{item.price} ₽</p>
          </div>
          <div className="cart-item-controls">
            <button onClick={() => updateQuantity(item.id, -1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, 1)}>+</button>
            <button onClick={() => removeItem(item.id)}>Удалить</button>
          </div>
        </div>
      ))}
      <div className="cart-total">
        <h3>Итого: {totalAmount} ₽</h3>
        <button onClick={checkout} className="checkout-btn">
          Оформить заказ
        </button>
      </div>
    </div>
  );
}

export default Cart;
