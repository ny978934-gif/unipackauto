
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../spareApi";
import logo from "../assests/logo.jpeg";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [spareOpen, setSpareOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spareCategories, setSpareCategories] = useState([]);

  // Custom cursor state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorHovered, setCursorHovered] = useState(false);

  const desktopSpareRef = useRef(null);
  const desktopSpareButtonRef = useRef(null);
  const mobileSpareRef = useRef(null);
  const mobileSpareButtonRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
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

  useEffect(() => {
    if (!spareOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !desktopSpareRef.current?.contains(target) &&
        !mobileSpareRef.current?.contains(target)
      ) {
        setSpareOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setSpareOpen(false);
      const activeElement = document.activeElement;
      const trigger = mobileSpareRef.current?.contains(activeElement)
        ? mobileSpareButtonRef.current
        : desktopSpareButtonRef.current;
      trigger?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [spareOpen]);

  // Track mouse inside the desktop dropdown for the custom cursor
  const handleDropdownMouseMove = useCallback((e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDropdownMouseEnter = useCallback(() => {
    setCursorVisible(true);
  }, []);

  const handleDropdownMouseLeave = useCallback(() => {
    setCursorVisible(false);
    setCursorHovered(false);
  }, []);

  const closeMenus = () => {
    setOpen(false);
    setSpareOpen(false);
  };

  return (
    <header className={`header-wrapper ${scrolled ? "is-sticky" : ""}`}>
      {/* Top Contact Bar */}
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

      {/* Floating Navbar Card */}
      <div className="navbar-container-outer">
        <nav className="navbar-card">
          {/* Logo */}
          <Link to="/#top" className="navbar-logo" onClick={closeMenus}>
            <img src={logo} alt="UniPackAuto Logo" />
          </Link>

          {/* Desktop Nav Items */}
          <div className="navbar-menu-desktop">
            <Link to="/#top" className="nav-link active" onClick={closeMenus}>Home</Link>
            <Link to="/#about" className="nav-link" onClick={closeMenus}>About Us</Link>
            <Link to="/#products" className="nav-link" onClick={closeMenus}>Products</Link>

            {/* Spare Parts Dropdown */}
            <div
              className={`dropdown-wrapper ${spareOpen ? "is-open" : ""}`}
              ref={desktopSpareRef}
              onMouseEnter={() => setSpareOpen(true)}
              onMouseLeave={() => setSpareOpen(false)}
            >
              <button
                type="button"
                className="nav-link dropdown-btn"
                ref={desktopSpareButtonRef}
                aria-expanded={spareOpen}
                aria-controls="desktop-spare-menu"
                onClick={(event) =>
                  setSpareOpen((isOpen) =>
                    event.detail > 0 ? true : !isOpen
                  )
                }
              >
                Spare Parts <span className="arrow">▾</span>
              </button>

              {/* Custom cursor dot — only visible inside the dropdown */}
              <div
                className={`dropdown-cursor ${cursorVisible ? "visible" : ""} ${cursorHovered ? "hovered" : ""}`}
                style={{ left: cursorPos.x, top: cursorPos.y }}
                aria-hidden="true"
              />

              <div
                className="dropdown-menu"
                id="desktop-spare-menu"
                aria-hidden={!spareOpen}
                ref={dropdownMenuRef}
                onMouseMove={handleDropdownMouseMove}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <Link
                  to="/spare-parts"
                  onClick={closeMenus}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  All Spare Parts
                </Link>
                {spareCategories.map((cat) => (
                  <Link
                    key={cat._id || cat.slug}
                    to={`/spare-parts/${cat.slug}`}
                    onClick={closeMenus}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/catalog" className="nav-link" onClick={closeMenus}>Catalog</Link>
            <Link to="/#contact" className="nav-link" onClick={closeMenus}>Contact Us</Link>
            <Link to="/#contact" className="btn-quote" onClick={closeMenus}>Get a Quote</Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="mobile-hamburger"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation-menu"
            onClick={() => {
              setOpen((isOpen) => !isOpen);
              setSpareOpen(false);
            }}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </nav>

        {/* Mobile Drawer */}
        {open && (
          <div className="mobile-menu-drawer" id="mobile-navigation-menu">
            <Link to="/#top" onClick={closeMenus}>Home</Link>
            <Link to="/#about" onClick={closeMenus}>About Us</Link>
            <Link to="/#products" onClick={closeMenus}>Products</Link>

            <div className="mobile-spare" ref={mobileSpareRef}>
              <button
                type="button"
                ref={mobileSpareButtonRef}
                aria-expanded={spareOpen}
                aria-controls="mobile-spare-menu"
                onClick={() => setSpareOpen((isOpen) => !isOpen)}
              >
                Spare Parts ▾
              </button>
              {spareOpen && (
                <div className="mobile-spare-links" id="mobile-spare-menu">
                  <Link to="/spare-parts" onClick={closeMenus}>All Spare Parts</Link>
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

            <Link to="/catalog" onClick={closeMenus}>Catalog</Link>
            <Link to="/#contact" onClick={closeMenus}>Contact Us</Link>
            <Link to="/#contact" className="btn-quote-mobile" onClick={closeMenus}>
              Get a Quote
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
