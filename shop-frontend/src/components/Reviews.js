import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Reviews.css";

const API_URL = "https://aws-wanos-printhub-d2ce.twc1.net/api";

function Reviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    rating: 5,
    comment: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/${productId}/reviews`,
      );
      setReviews(response.data);

      // Calculate average rating
      if (response.data.length > 0) {
        const avg =
          response.data.reduce((sum, review) => sum + review.rating, 0) /
          response.data.length;
        setAvgRating(avg);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/products/${productId}/reviews`, formData);
      setSubmitted(true);
      setShowForm(false);
      setFormData({ customer_name: "", rating: 5, comment: "" });
      setTimeout(() => setSubmitted(false), 5000);
      fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Ошибка при отправке отзыва. Пожалуйста, попробуйте снова.");
    }
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <div className="reviews-summary">
          <h3>Отзывы ({reviews.length})</h3>
          {reviews.length > 0 && (
            <div className="rating-summary">
              <span className="avg-rating">{avgRating.toFixed(1)}</span>
              <span className="stars">
                {renderStars(Math.round(avgRating))}
              </span>
            </div>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="write-review-btn">
          Написать отзыв
        </button>
      </div>

      {submitted && (
        <div className="review-success">
          Спасибо за отзыв! Он будет опубликован после проверки.
        </div>
      )}

      {showForm && (
        <div className="review-modal">
          <div className="review-modal-content">
            <h3>Ваш отзыв</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Ваше имя *"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                required
              />
              <div className="rating-select">
                <label>Оценка:</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${formData.rating >= star ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Ваш комментарий *"
                value={formData.comment}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
                rows="4"
                required
              />
              <div className="review-buttons">
                <button type="submit">Отправить</button>
                <button type="button" onClick={() => setShowForm(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">Пока нет отзывов. Будьте первым!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <strong>{review.customer_name}</strong>
                <div className="review-rating">
                  <span className="stars">{renderStars(review.rating)}</span>
                </div>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Reviews;
