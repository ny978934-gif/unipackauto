import React from "react";
import { Link } from "react-router-dom";
import logo from "../assests/logo.jpeg";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        
        {/* Column 1: Brand Info & Socials */}
        <div className="footer__col footer__col--brand">
          <Link to="/#top" className="footer__brand">
            <div className="footer__brand-icon">
              <img className="footer__brand-logo" src={logo} alt="Unipackauto logo" />
            </div>
            <div className="footer__brand-text">
              {/* <span className="footer_rand-title">Unipackauto</span> */}
              {/* <span className="footer__brand-sub">INDIA PVT. LTD.</span> */}
            </div>
          </Link>

          <p className="footer__description">
            Manufacturing, exporting, and supplying a wide range of industrial
            packaging machinery for over 25 years.
          </p>

          <div className="footer__socials">
            <a href="https://facebook.com" aria-label="Facebook" className="footer__social-btn">
              {/* Facebook Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer__col">
          <h3 className="footer__heading">Quick Links</h3>
          <ul className="footer__links">
            <li><Link to="/#top">Home</Link></li>
            <li><Link to="/#products">Products</Link></li>
            <li><Link to="/#about">About Us</Link></li>
            <li><Link to="/#why-us">Why Choose Us</Link></li>
            <li><Link to="/#partners">Channel Partners</Link></li>
            <li><Link to="/#contact">Contact Us</Link></li>
            <li><Link to="/catalog">Catalog</Link></li>
            <li><Link to="/get-quote">Get a Quote</Link></li>
          </ul>
        </div>

        {/* Column 3: Our Products */}
        <div className="footer__col">
          <h3 className="footer__heading">Our Products</h3>
          <ul className="footer__links">
            <li><Link to="/#products">Strapping Machine</Link></li>
            <li><Link to="/#products">Sealing Machines</Link></li>
            <li><Link to="/#products">Stretch Wrapping Machine</Link></li>
            <li><Link to="/#products">Vacuum Packaging Machines</Link></li>
            <li><Link to="/#products">Shrink Wrapping System</Link></li>
            <li><Link to="/#products">Cotton Wick Making Machine</Link></li>
            <li><Link to="/#products">Bag Closer Machine</Link></li>
            <li><Link to="/#products">Material Handling</Link></li>
            <li className="footer__link-download">
              <Link to="/#products">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Download Catalogue
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Get in Touch */}
        <div className="footer__col">
          <h3 className="footer__heading">Get in Touch</h3>
          <div className="footer__contact-info">
            <div className="footer__contact-item">
              <div className="footer__contact-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <span>
                Office No. 2, Behind Shiv Shakti Oil Meal, Thada - Trehan Road, Alwar Road, Bhiwadi, Rajasthan - 301018
              </span>
            </div>

            <div className="footer__contact-item">
              <div className="footer__contact-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <span>09215521314, 07232001235, 9991226074</span>
            </div>

            <div className="footer__contact-item">
              <div className="footer__contact-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <span>
                <a href="mailto:info@unipackauto.in">info@unipackauto.in</a><br />
                <a href="mailto:uniquepackagingandautomation@gmail.com">uniquepackagingandautomation@gmail.com</a><br />
                <a href="mailto:services.upa@gmail.com">services.upa@gmail.com</a>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Bottom / Copyright */}
      <div className="footer__bottom">
        <div className="footer__container">
          <p className="footer__copyright">
            All Rights Reserved. Unipackauto India Pvt. Ltd. — Bhiwadi, Rajasthan, India
          </p>
        </div>
      </div>
    </footer>
  );
}