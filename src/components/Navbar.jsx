
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../spareApi";
import logo from "../assests/logo.jpeg";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [spareOpen, setSpareOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spareCategories, setSpareCategories] = useState([]);

  useEffect(() => {
    const onScroll = () => {
      // Jab scroll threshold se aage jaye toh sticky mode trigger karein
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/spare/categories`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSpareCategories(Array.isArray(data) ? data : []))
      .catch(() => setSpareCategories([]));

    return () => controller.abort();
  }, []);

  const closeMenus = () => {
    setOpen(false);
    setSpareOpen(false);
  };

  return (
    <header className={`header-wrapper ${scrolled ? "is-sticky" : ""}`}>
      {/* Top Contact Bar (Normal scroll ke sath upar chala jayega) */}
      <div className="top-info-bar">
        <div className="top-info-container">
          <div className="top-info-left">
            <a href="tel:+919991226074" className="top-info-item">
              📞 +91 99912 26074
            </a>
            <a href="tel:+919215527314" className="top-info-item">
              📞 +91 92155 27314
            </a>
            <span className="top-info-item">📍 Bhiwadi (Rajasthan - India)</span>
          </div>

          <div className="top-info-right">
            <a
              href="https://wa.me/919785377675"
              target="_blank"
              rel="noreferrer"
              className="top-info-item wa-link"
            >
              💬 WhatsApp: +91 97853 77675
            </a>
          </div>
        </div>
      </div>

      {/* Floating White Card Navbar (Scroll par sticky ho jayega) */}
      <div className="navbar-container-outer">
        <nav className="navbar-card">
          {/* Logo */}
          <Link to="/#top" className="navbar-logo" onClick={closeMenus}>
            <img src={logo} alt="UniPackAuto Logo" />
          </Link>

          {/* Desktop Nav Items */}
          <div className="navbar-menu-desktop">
            <Link to="/#top" className="nav-link active">
              Home
            </Link>
            <Link to="/#about" className="nav-link">
              About Us
            </Link>
            <Link to="/#products" className="nav-link">
              Products
            </Link>

            {/* Spare Parts Dropdown */}
            <div
              className="dropdown-wrapper"
              onMouseEnter={() => setSpareOpen(true)}
              onMouseLeave={() => setSpareOpen(false)}
            >
              <button
                type="button"
                className="nav-link dropdown-btn"
                onClick={() => setSpareOpen(!spareOpen)}
              >
                Spare Parts <span className="arrow">▾</span>
              </button>

              {spareOpen && (
                <div className="dropdown-menu">
                  <Link to="/spare-parts" onClick={closeMenus}>
                    All Spare Parts
                  </Link>
                  {spareCategories.map((cat) => (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/spare-parts/${cat.slug}`}
                      onClick={closeMenus}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/catalog" className="nav-link">
              Catalog
            </Link>
            <Link to="/#contact" className="nav-link">
              Contact Us
            </Link>

            <Link to="/#contact" className="btn-quote" onClick={closeMenus}>
              Get a Quote
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-hamburger"
            aria-label="Toggle Navigation"
            onClick={() => setOpen(!open)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </nav>

        {/* Mobile Dropdown View */}
        {open && (
          <div className="mobile-menu-drawer">
            <Link to="/#top" onClick={closeMenus}>
              Home
            </Link>
            <Link to="/#about" onClick={closeMenus}>
              About Us
            </Link>
            <Link to="/#products" onClick={closeMenus}>
              Products
            </Link>

            <div className="mobile-spare">
              <button onClick={() => setSpareOpen(!spareOpen)}>
                Spare Parts ▾
              </button>
              {spareOpen && (
                <div className="mobile-spare-links">
                  <Link to="/spare-parts" onClick={closeMenus}>
                    All Spare Parts
                  </Link>
                  {spareCategories.map((cat) => (
                    <Link
                      key={cat._id || cat.slug}
                      to={`/spare-parts/${cat.slug}`}
                      onClick={closeMenus}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/catalog" onClick={closeMenus}>
              Catalog
            </Link>
            <Link to="/#contact" onClick={closeMenus}>
              Contact Us
            </Link>
            <Link to="/#contact" className="btn-quote-mobile" onClick={closeMenus}>
              Get a Quote
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}