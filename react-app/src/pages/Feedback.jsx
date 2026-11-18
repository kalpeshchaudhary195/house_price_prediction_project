import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { isValidEmail } from '../utils/validators.js';

export default function Feedback() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: '5',
    feedback_type: 'website',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (formData.message.trim().length < 10) {
      showToast('Message must be at least 10 characters long.', 'error');
      return;
    }

    setSubmitted(true);
    showToast('Thank you for your feedback! It helps improve our model and platform.', 'success');
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="hero-eyebrow">Your Voice Matters</span>
          <h1>We Value Your Feedback</h1>
          <p className="hero-subtitle">
            Help us improve the prediction accuracy, user interface, and overall experience by sharing your thoughts.
          </p>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <div className="feedback-layout">
            <form className="card contact-form-card" onSubmit={handleSubmit} noValidate>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Feedback Submitted</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '8px 0 20px' }}>
                    Thank you, {formData.name}! We appreciate your perspective.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        rating: '5',
                        feedback_type: 'website',
                        message: '',
                      });
                    }}
                  >
                    Send Another Response
                  </button>
                </div>
              ) : (
                <>
                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label htmlFor="fb-name">Full Name *</label>
                    <input
                      type="text"
                      id="fb-name"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label htmlFor="fb-email">Email Address *</label>
                    <input
                      type="email"
                      id="fb-email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label>Rating *</label>
                    <div className="rating-group">
                      {['1', '2', '3', '4', '5'].map((star) => (
                        <label key={star} className="rating-option">
                          <input
                            type="radio"
                            name="rating"
                            value={star}
                            checked={formData.rating === star}
                            onChange={handleChange}
                          />{' '}
                          {'⭐'.repeat(Number(star))} {star}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label htmlFor="fb-type">Feedback Type *</label>
                    <select
                      id="fb-type"
                      name="feedback_type"
                      value={formData.feedback_type}
                      onChange={handleChange}
                      required
                    >
                      <option value="website">Website Interface</option>
                      <option value="prediction">Prediction Accuracy</option>
                      <option value="design">Design &amp; Theme</option>
                      <option value="performance">Performance &amp; Speed</option>
                      <option value="feature">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: '22px' }}>
                    <label htmlFor="fb-message">Message *</label>
                    <textarea
                      id="fb-message"
                      name="message"
                      rows="5"
                      placeholder="Tell us what you think (min 10 characters)..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    Submit Feedback
                  </button>
                </>
              )}
            </form>
          </div>
        </section>

        {/* ================= TESTIMONIALS ================= */}
        <section className="section" style={{ paddingTop: 0 }}>
          <span className="section-eyebrow">Community</span>
          <h2 className="section-title">What Users Say</h2>
          <p className="section-subtitle">A few words from people who have tried the platform.</p>

          <div className="testimonial-grid">
            <div className="card testimonial-card slide-up">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The prediction dashboard feels genuinely polished — clean layout, live API responses and clear results."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">RS</div>
                Riya Sharma
              </div>
            </div>

            <div className="card testimonial-card slide-up slide-up-delay-1">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Simple to use and the dark mode toggle is very well crafted. The interactive property slider is smooth!"
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">AV</div>
                Aman Verma
              </div>
            </div>

            <div className="card testimonial-card slide-up slide-up-delay-2">
              <div className="testimonial-stars">⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Great system — real trained Random Forest model with genuine R² metrics and comparison charts."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">PN</div>
                Priya Nair
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
