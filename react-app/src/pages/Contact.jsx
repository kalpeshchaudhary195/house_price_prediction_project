import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { isValidEmail } from '../utils/validators.js';

export default function Contact() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter your name.', 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!formData.subject.trim()) {
      showToast('Please enter a subject.', 'error');
      return;
    }
    if (formData.message.trim().length < 10) {
      showToast('Message must be at least 10 characters long.', 'error');
      return;
    }

    setSent(true);
    showToast('Your message has been sent successfully!', 'success');
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="hero-eyebrow">Get in Touch</span>
          <h1>We'd Love to Hear From You</h1>
          <p className="hero-subtitle">
            Have a question about the prediction model, found a bug, or want to discuss enterprise deployment? Reach out anytime.
          </p>
        </div>
      </section>

      <div className="container">
        <section className="section">
          {/* ================= CONTACT INFO CARDS ================= */}
          <div className="contact-cards">
            <div className="card contact-card slide-up">
              <div className="contact-icon">📧</div>
              <h3>Email</h3>
              <a href="mailto:support@houseprediction.com">support@houseprediction.com</a>
            </div>
            <div className="card contact-card slide-up slide-up-delay-1">
              <div className="contact-icon">📞</div>
              <h3>Phone</h3>
              <a href="tel:+917984951326">+91 79849 51326</a>
            </div>
            <div className="card contact-card slide-up slide-up-delay-2">
              <div className="contact-icon">📍</div>
              <h3>Location</h3>
              <p>Ahmedabad, Gujarat, India</p>
            </div>
          </div>

          {/* ================= MAP EMBED ================= */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '24px' }}>
            <iframe
              src="https://maps.google.com/maps?q=23.0881262,72.5266064&z=15&output=embed"
              width="100%"
              height="350"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Our location on Google Maps"
            />
          </div>

          {/* ================= CONTACT FORM + FAQ ================= */}
          <div className="contact-layout">
            <form className="card contact-form-card" onSubmit={handleSubmit} noValidate>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Send a Message</h2>

              {sent ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>✉️</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Message Sent</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '6px 0 16px' }}>
                    Thank you, {formData.name}. We will get back to you within 24 hours.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSent(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label htmlFor="c-name">Your Name *</label>
                    <input
                      type="text"
                      id="c-name"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label htmlFor="c-email">Your Email *</label>
                    <input
                      type="email"
                      id="c-email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '18px' }}>
                    <label htmlFor="c-subject">Subject *</label>
                    <input
                      type="text"
                      id="c-subject"
                      name="subject"
                      placeholder="What is this regarding?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '22px' }}>
                    <label htmlFor="c-message">Message *</label>
                    <textarea
                      id="c-message"
                      name="message"
                      rows="5"
                      placeholder="Write your message here (min 10 characters)..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    Send Message
                  </button>
                </>
              )}
            </form>

            <div className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Frequently Asked Questions</h2>

              <details className="faq-item">
                <summary>How does the prediction work?</summary>
                <p>
                  You enter housing attributes like median income, average rooms and geographical coordinates, and our trained Machine Learning regression pipeline calculates an instant predicted valuation.
                </p>
              </details>

              <details className="faq-item">
                <summary>Which dataset is used?</summary>
                <p>
                  The platform uses the California Housing Dataset consisting of 20,640 census block records with 9 predictive attributes and geographic features.
                </p>
              </details>

              <details className="faq-item">
                <summary>Which algorithm performs best?</summary>
                <p>
                  We evaluated 5 algorithms (Linear Regression, Decision Tree, Random Forest, Gradient Boosting, Extra Trees). Random Forest achieved the highest score with an R² of 0.8172 and lowest MAE of ~$31,628.
                </p>
              </details>

              <details className="faq-item">
                <summary>Can I use the website on mobile?</summary>
                <p>Yes, the entire interface is fully responsive across desktop, tablet and mobile devices.</p>
              </details>

              <details className="faq-item">
                <summary>Is my prediction history saved?</summary>
                <p>
                  Yes! All predictions are logged to the database and can be reviewed anytime in your Profile & History tab.
                </p>
              </details>
            </div>
          </div>

          {/* ======= TEAM ========= */}
          <div className="team-grid">
            <div className="card team-card">
              <div className="team-avatar">KC</div>
              <h3>Kalpesh Chaudhary</h3>
              <div className="team-role">Co-Founder</div>
              <div className="team-detail">
                📞 <a href="tel:+917984951326">+91 79849 51326</a>
              </div>
              <div className="team-detail">
                ✉️ <a href="mailto:kalpeshchaudhary159@gmail.com">kalpeshchaudhary159@gmail.com</a>
              </div>
            </div>

            <div className="card team-card">
              <div className="team-avatar">KP</div>
              <h3>Karm Patel</h3>
              <div className="team-role">Co-Founder</div>
              <div className="team-detail">
                📞 <a href="tel:+916351951312">+91 63519 51312</a>
              </div>
              <div className="team-detail">
                ✉️ <a href="mailto:karmpatel12@gmail.com">karmpatel12@gmail.com</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
