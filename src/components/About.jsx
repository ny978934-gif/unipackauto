import React from 'react';
import { Link } from 'react-router-dom';
import aboutImage from '../assests/a.jpg';
import './About.css';

export default function About() {
  const features = [
    'Manufacturing, Exporting & Supplying',
    'Family Owned & Operated Venture',
    'Cost-Effective Pricing Worldwide',
    'Wide Range of Industrial Machinates',
  ];

  const stats = [
    { value: '15+', label: 'Product Categories' },
    { value: '120+', label: 'Global Clients' },
    { value: '25+', label: 'Years of Trust' },
  ];

  return (
    <section id="about" className="about-section">
      <div className="about__container">
        {/* Left Side: Image with Overlay Badge */}
        <div className="about__media">
          <div className="about__image-wrapper">
            <img
              src={aboutImage}
              alt="Unipackauto India manufacturing facility with automated machinery"
              className="about__image"
              loading="lazy"
            />
            <div className="about__image-overlay" />
          </div>

          {/* Floating Experience Badge */}
          <div className="about__experience-badge">
            <div className="about__badge-number">25+</div>
            <div className="about__badge-text">
              <strong>Years of</strong>
              <span>Excellence</span>
            </div>
          </div>

          {/* Decorative dot pattern */}
          <div className="about__dots" aria-hidden="true" />
        </div>

        {/* Right Side: Content */}
        <div className="about__content">
          <span className="about__eyebrow">
            <span className="about__eyebrow-line" />
            About Us
          </span>

          <h2 className="about__heading">
            About <span className="about__highlight">Unipackauto India</span>{' '}
            Pvt. Ltd.
          </h2>

          <p className="about__description">
            Unipackauto India Pvt. Ltd. is a family owned venture engaged in
            manufacturing, exporting and supplying a wide range of industrial
            machinates to our clients. Our product range comprises of varied
            Automatic Mattress Wrapping Machine, Sealing Machines, Pick Fill
            Sealing Machine, Continuous Band Sealers, Cup and Tray Sealers,
            Foil Sealers, Foot Operated Sealer, Hand Sealing Machines, Mobile
            Sealing Machine, Dispensing Machines, Shrink Wrapping System, Bag
            Closer Machine, Motorized Belt Conveyor, Belt Conveyor Idler, Gas
            Mixer etc. Customers can avail these products at cost effective
            prices across the world.
          </p>

          <ul className="about__features">
            {features.map((feature, index) => (
              <li key={index} className="about__feature">
                <span className="about__feature-icon" aria-hidden="true">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="about__feature-text">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Mini Stats Row */}
          <div className="about__stats">
            {stats.map((stat, index) => (
              <div key={index} className="about__stat">
                <div className="about__stat-value">{stat.value}</div>
                <div className="about__stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="about__actions">
            <Link to="/get-quote" className="about__cta">
              Get a Quote
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link to="/#products" className="about__cta-secondary">
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}