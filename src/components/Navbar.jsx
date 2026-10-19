import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../spareApi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AuthModal from "./auth/AuthModal";
import logo from "../assests/logo.jpeg";
import catalogPdf from "../assests/unipackauto-india.pdf";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout }  = useAuth();
  const { itemCount }     = useCart();
  const navigate          = useNavigate();

  const [open,          setOpen]          = useState(false);
  const [spareOpen,     setSpareOpen]     = useState(false);
  const [machinesOpen,  setMachinesOpen]  = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [spareCategories,   setSpareCategories]   = useState([]);
  const [machineCategories, setMachineCategories] = useState([]);

  // Auth modal
  const [authOpen,   setAuthOpen]   = useState(false);
  const [authTab,    setAuthTab]    = useState("login");

  const desktopSpareRef          = useRef(null);
  const desktopSpareButtonRef    = useRef(null);
  const mobileSpareRef           = useRef(null);
  const mobileSpareButtonRef     = useRef(null);
  const desktopMachinesRef       = useRef(null);
  const desktopMachinesButtonRef = useRef(null);
  const mobileMachinesRef        = useRef(null);
  const mobileMachinesButtonRef  = useRef(null);
  const userMenuRef              = useRef(null);

  // ── Scroll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Outside-click for dropdown menus ─────────────────────────────────────
  useEffect(() => {
    if (!spareOpen && !machinesOpen) return undefined;
    const close = (e) => {
      if (
        !desktopSpareRef.current?.contains(e.target) &&
        !mobileSpareRef.current?.contains(e.target) &&
        !desktopMachinesRef.current?.contains(e.target) &&
        !mobileMachinesRef.current?.contains(e.target)
      ) { setSpareOpen(false); setMachinesOpen(false); }
    };
    const onEsc = (e) => {
      if (e.key !== "Escape") return;
      setSpareOpen(false); setMachinesOpen(false);
      const active = document.activeElement;
      const trigger =
        mobileMachinesRef.current?.contains(active) ? mobileMachinesButtonRef.current
        : desktopMachinesRef.current?.contains(active) ? desktopMachinesButtonRef.current
        : mobileSpareRef.current?.contains(active) ? mobileSpareButtonRef.current
        : desktopSpareButtonRef.current;
      trigger?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", onEsc); };
  }, [spareOpen, machinesOpen]);

  // ── Outside-click for user menu ───────────────────────────────────────────
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const close = (e) => { if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [userMenuOpen]);

  // ── Fetch nav categories ──────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${API}/api/spare/categories?type=sparepart`, { signal: controller.signal }),
      fetch(`${API}/api/spare/categories?type=machine`,   { signal: controller.signal }),
    ])
      .then(async ([sr, mr]) => {
        if (!sr.ok || !mr.ok) throw new Error();
        const [sd, md] = await Promise.all([sr.json(), mr.json()]);
        setSpareCategories(Array.isArray(sd) ? sd : []);
        setMachineCategories(Array.isArray(md) ? md : []);
      })
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });
    return () => controller.abort();
  }, []);

  const closeMenus = useCallback(() => {
    setOpen(false); setSpareOpen(false); setMachinesOpen(false); setUserMenuOpen(false);
  }, []);

  const openAuth = (tab = "login") => { setAuthTab(tab); setAuthOpen(true); closeMenus(); };

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate("/"); };

  const sortedSpareCategories = [...spareCategories].sort((a, b) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? ""), undefined, { sensitivity: "base" })
  );

  return (
    <>
      <header className={`header-wrapper ${scrolled ? "is-sticky" : ""}`}>
        {/* ── Top contact bar ── */}
        <div className="top-info-bar">
          <div className="top-info-container">
            <div className="top-info-left">
              <a href="tel:+919215521314" className="top-info-item">📞 +91 9215521314</a>
              <a href="tel:+917232001235" className="top-info-item">📞 +91 7232001235</a>
              <span className="top-info-item">📍 Bhiwadi (Rajasthan - India)</span>
            </div>
            <div className="top-info-right">
              <a href="https://wa.me/919215521314" target="_blank" rel="noreferrer" className="top-info-item wa-link">
                💬 WhatsApp: +91 92155 21314
              </a>
            </div>
          </div>
        </div>

        {/* ── Floating navbar card ── */}
        <div className="navbar-container-outer">
          <nav className="navbar-card">
            {/* Logo */}
            <Link to="/#top" className="navbar-logo" onClick={closeMenus}>
              <img src={logo} alt="UniPackAuto Logo" />
            </Link>

            {/* Desktop nav */}
            <div className="navbar-menu-desktop">
              <Link to="/#top"     className="nav-link active" onClick={closeMenus}>Home</Link>
              <Link to="/#about"   className="nav-link"        onClick={closeMenus}>About Us</Link>

              {/* Spare Parts dropdown */}
              <div
                className={`dropdown-wrapper ${spareOpen ? "is-open" : ""}`}
                ref={desktopSpareRef}
                onMouseEnter={() => { setSpareOpen(true); setMachinesOpen(false); }}
                onMouseLeave={() => setSpareOpen(false)}
                onFocus={() => setSpareOpen(true)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSpareOpen(false); }}
              >
                <button type="button" className="nav-link dropdown-btn"
                  ref={desktopSpareButtonRef}
                  aria-expanded={spareOpen} aria-controls="desktop-spare-menu"
                  onClick={() => { setMachinesOpen(false); setSpareOpen(true); }}
                >
                  Spare Parts <span className="arrow">▾</span>
                </button>
                <div className="dropdown-menu" id="desktop-spare-menu" aria-hidden={!spareOpen}>
                  <Link to="/spare-parts" onClick={closeMenus}>All Spare Parts</Link>
                  {sortedSpareCategories.map((cat) => (
                    <Link key={cat._id || cat.slug} to={`/spare-parts/${cat.slug}`} onClick={closeMenus}>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Products dropdown */}
              <div
                className={`dropdown-wrapper ${machinesOpen ? "is-open" : ""}`}
                ref={desktopMachinesRef}
                onMouseEnter={() => { setMachinesOpen(true); setSpareOpen(false); }}
                onMouseLeave={() => setMachinesOpen(false)}
                onFocus={() => setMachinesOpen(true)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMachinesOpen(false); }}
              >
                <button type="button" className="nav-link dropdown-btn"
                  ref={desktopMachinesButtonRef}
                  aria-expanded={machinesOpen} aria-controls="desktop-machine-menu"
                  onClick={() => { setSpareOpen(false); setMachinesOpen(true); }}
                >
                  Products <span className="arrow">▾</span>
                </button>
                <div className="dropdown-menu" id="desktop-machine-menu" aria-hidden={!machinesOpen}>
                  <Link to="/products" onClick={closeMenus}>All Products / Machines</Link>
                  {machineCategories.map((cat) => (
                    <Link key={cat._id || cat.slug} to={`/products/${cat.slug}`} onClick={closeMenus}>
                      {cat.name}
                    </Link>
                  ))}
                  <div className="products-menu-actions">
                    <a href={catalogPdf} download="unipackauto-india-catalogue.pdf">
                      Download Catalogue
                    </a>
                    <a href="https://www.unipackauto.in/" target="_blank" rel="noopener noreferrer">
                      View Machines
                    </a>
                  </div>
                </div>
              </div>

              <Link to="/catalog"  className="nav-link" onClick={closeMenus}>Catalog</Link>
              <Link to="/#contact" className="nav-link" onClick={closeMenus}>Contact Us</Link>

              {/* ── Cart icon ── */}
              <Link to="/cart" className="nav-cart-btn" aria-label={`Cart (${itemCount} items)`} onClick={closeMenus}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {itemCount > 0 && (
                  <span className="nav-cart-badge" aria-label={`${itemCount} items in cart`}>
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {/* ── User / Auth ── */}
              {user ? (
                <div className="nav-user-wrapper" ref={userMenuRef}>
                  <button
                    type="button"
                    className="nav-user-btn"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setUserMenuOpen((v) => !v)}
                  >
                    <span className="nav-user-avatar" aria-hidden="true">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="nav-user-name">{user.name.split(" ")[0]}</span>
                    <span className="arrow" aria-hidden="true">▾</span>
                  </button>
                  {userMenuOpen && (
                    <div className="nav-user-menu" role="menu">
                      <div className="nav-user-menu-header">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                      <Link to="/cart"    role="menuitem" className="nav-user-menu-item" onClick={() => setUserMenuOpen(false)}>🛒 My Cart {itemCount > 0 && <span className="nav-user-menu-badge">{itemCount}</span>}</Link>
                      <Link to="/get-quote" role="menuitem" className="nav-user-menu-item" onClick={() => setUserMenuOpen(false)}>📋 Get a Quote</Link>
                      <button type="button" role="menuitem" className="nav-user-menu-item nav-user-menu-logout" onClick={handleLogout}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="nav-login-btn" onClick={() => openAuth("login")}>
                  Log In
                </button>
              )}

              <Link to="/get-quote" className="btn-quote" onClick={closeMenus}>Get a Quote</Link>
            </div>

            {/* ── Mobile: cart + hamburger ── */}
            <div className="mobile-right-controls">
              <Link to="/cart" className="nav-cart-btn" aria-label={`Cart (${itemCount} items)`} onClick={closeMenus}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {itemCount > 0 && <span className="nav-cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>}
              </Link>

              <button
                type="button" className="mobile-hamburger"
                aria-label={open ? "Close navigation" : "Open navigation"}
                aria-expanded={open} aria-controls="mobile-navigation-menu"
                onClick={() => { setOpen((v) => !v); setSpareOpen(false); setMachinesOpen(false); }}
              >
                <span className="bar" /><span className="bar" /><span className="bar" />
              </button>
            </div>
          </nav>

          {/* ── Mobile drawer ── */}
          {open && (
            <div className="mobile-menu-drawer" id="mobile-navigation-menu">
              <Link to="/#top"   onClick={closeMenus}>Home</Link>
              <Link to="/#about" onClick={closeMenus}>About Us</Link>

              <div className="mobile-spare" ref={mobileSpareRef}>
                <button type="button" ref={mobileSpareButtonRef} aria-expanded={spareOpen} aria-controls="mobile-spare-menu"
                  onClick={() => { setSpareOpen((v) => !v); setMachinesOpen(false); }}>
                  Spare Parts ▾
                </button>
                {spareOpen && (
                  <div className="mobile-spare-links" id="mobile-spare-menu">
                    <Link to="/spare-parts" onClick={closeMenus}>All Spare Parts</Link>
                    {sortedSpareCategories.map((cat) => (
                      <Link key={cat._id || cat.slug} to={`/spare-parts/${cat.slug}`} onClick={closeMenus}>{cat.name}</Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mobile-spare" ref={mobileMachinesRef}>
                <button type="button" ref={mobileMachinesButtonRef} aria-expanded={machinesOpen} aria-controls="mobile-machine-menu"
                  onClick={() => { setMachinesOpen((v) => !v); setSpareOpen(false); }}>
                  Products ▾
                </button>
                {machinesOpen && (
                  <div className="mobile-spare-links" id="mobile-machine-menu">
                    <Link to="/products" onClick={closeMenus}>All Products / Machines</Link>
                    {machineCategories.map((cat) => (
                      <Link key={cat._id || cat.slug} to={`/products/${cat.slug}`} onClick={closeMenus}>{cat.name}</Link>
                    ))}
                    <div className="products-menu-actions">
                      <a href={catalogPdf} download="unipackauto-india-catalogue.pdf">
                        Download Catalogue
                      </a>
                      <a href="https://www.unipackauto.in/" target="_blank" rel="noopener noreferrer">
                        View Machines
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/catalog"  onClick={closeMenus}>Catalog</Link>
              <Link to="/#contact" onClick={closeMenus}>Contact Us</Link>

              {/* Auth row in mobile drawer */}
              {user ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
                    <span className="nav-user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                    <span>{user.name}</span>
                  </div>
                  <Link to="/cart" className="mobile-menu-link" onClick={closeMenus}>🛒 My Cart {itemCount > 0 && `(${itemCount})`}</Link>
                  <button type="button" className="mobile-logout-btn" onClick={handleLogout}>Sign Out</button>
                </div>
              ) : (
                <div className="mobile-auth-row">
                  <button type="button" className="mobile-login-btn" onClick={() => openAuth("login")}>Log In</button>
                  <button type="button" className="mobile-signup-btn" onClick={() => openAuth("signup")}>Sign Up</button>
                </div>
              )}

              <Link to="/get-quote" className="btn-quote-mobile" onClick={closeMenus}>Get a Quote</Link>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal — rendered outside the header so it overlays everything */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </>
  );
}
