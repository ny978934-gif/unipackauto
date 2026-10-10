
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../spareApi";
import logo from "../assests/logo.jpeg";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [spareOpen, setSpareOpen] = useState(false);
  const [machinesOpen, setMachinesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spareCategories, setSpareCategories] = useState([]);
  const [machineCategories, setMachineCategories] = useState([]);

  const desktopSpareRef = useRef(null);
  const desktopSpareButtonRef = useRef(null);
  const mobileSpareRef = useRef(null);
  const mobileSpareButtonRef = useRef(null);
  const desktopMachinesRef = useRef(null);
  const desktopMachinesButtonRef = useRef(null);
  const mobileMachinesRef = useRef(null);
  const mobileMachinesButtonRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!spareOpen && !machinesOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !desktopSpareRef.current?.contains(target) &&
        !mobileSpareRef.current?.contains(target) &&
        !desktopMachinesRef.current?.contains(target) &&
        !mobileMachinesRef.current?.contains(target)
      ) {
        setSpareOpen(false);
        setMachinesOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setSpareOpen(false);
      setMachinesOpen(false);
      const activeElement = document.activeElement;
      const trigger = mobileMachinesRef.current?.contains(activeElement)
        ? mobileMachinesButtonRef.current
        : desktopMachinesRef.current?.contains(activeElement)
          ? desktopMachinesButtonRef.current
          : mobileSpareRef.current?.contains(activeElement)
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
  }, [spareOpen, machinesOpen]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${API}/api/spare/categories?type=sparepart`, { signal: controller.signal }),
      fetch(`${API}/api/spare/categories?type=machine`, { signal: controller.signal }),
    ])
      .then(async ([spareResponse, machineResponse]) => {
        if (!spareResponse.ok || !machineResponse.ok) {
          throw new Error("Unable to load navigation categories.");
        }
        const [spareData, machineData] = await Promise.all([
          spareResponse.json(),
          machineResponse.json(),
        ]);
        setSpareCategories(Array.isArray(spareData) ? spareData : []);
        setMachineCategories(Array.isArray(machineData) ? machineData : []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, []);

  const closeMenus = () => {
    setOpen(false);
    setSpareOpen(false);
    setMachinesOpen(false);
  };

  return (
    <header className={`header-wrapper ${scrolled ? "is-sticky" : ""}`}>
      {/* Top Contact Bar */}
      <div className="top-info-bar">
        <div className="top-info-container">
          <div className="top-info-left">
            <a href="tel:+919991226074" className="top-info-item">
              📞 +91 9215521314
            </a>
            <a href="tel:+919215527314" className="top-info-item">
              📞 +91 7232001235
            </a>
            <span className="top-info-item"> Bhiwadi (Rajasthan - India)</span>
          </div>
          <div className="top-info-right">
            <a
              href="https://wa.me/919215521314"
              target="_blank"
              rel="noreferrer"
              className="top-info-item wa-link"
            >
              💬 WhatsApp: +91 92155 21314
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
            {/* Spare Parts Dropdown */}
            <div
              className={`dropdown-wrapper ${spareOpen ? "is-open" : ""}`}
              ref={desktopSpareRef}
              onMouseEnter={() => {
                setSpareOpen(true);
                setMachinesOpen(false);
              }}
              onMouseLeave={() => setSpareOpen(false)}
              onFocus={() => setSpareOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setSpareOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="nav-link dropdown-btn"
                ref={desktopSpareButtonRef}
                aria-expanded={spareOpen}
                aria-controls="desktop-spare-menu"
                onClick={() => {
                  setMachinesOpen(false);
                  setSpareOpen(true);
                }}
              >
                Spare Parts <span className="arrow">▾</span>
              </button>

              <div
                className="dropdown-menu"
                id="desktop-spare-menu"
                aria-hidden={!spareOpen}
              >
                <Link
                  to="/spare-parts"
                  onClick={closeMenus}
                >
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
            </div>

            <div
              className={`dropdown-wrapper ${machinesOpen ? "is-open" : ""}`}
              ref={desktopMachinesRef}
              onMouseEnter={() => {
                setMachinesOpen(true);
                setSpareOpen(false);
              }}
              onMouseLeave={() => setMachinesOpen(false)}
              onFocus={() => setMachinesOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setMachinesOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="nav-link dropdown-btn"
                ref={desktopMachinesButtonRef}
                aria-expanded={machinesOpen}
                aria-controls="desktop-machine-menu"
                onClick={() => {
                  setSpareOpen(false);
                  setMachinesOpen(true);
                }}
              >
                Products <span className="arrow">▾</span>
              </button>
              <div
                className="dropdown-menu"
                id="desktop-machine-menu"
                aria-hidden={!machinesOpen}
              >
                <Link to="/products" onClick={closeMenus}>All Products / Machines</Link>
                {machineCategories.map((category) => (
                  <Link
                    key={category._id || category.slug}
                    to={`/products/${category.slug}`}
                    onClick={closeMenus}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/catalog" className="nav-link" onClick={closeMenus}>Catalog</Link>
            <Link to="/#contact" className="nav-link" onClick={closeMenus}>Contact Us</Link>
            <Link to="/get-quote" className="btn-quote" onClick={closeMenus}>Get a Quote</Link>
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
              setMachinesOpen(false);
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
            <div className="mobile-spare" ref={mobileSpareRef}>
              <button
                type="button"
                ref={mobileSpareButtonRef}
                aria-expanded={spareOpen}
                aria-controls="mobile-spare-menu"
                onClick={() => {
                  setSpareOpen((isOpen) => !isOpen);
                  setMachinesOpen(false);
                }}
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

            <div className="mobile-spare" ref={mobileMachinesRef}>
              <button
                type="button"
                ref={mobileMachinesButtonRef}
                aria-expanded={machinesOpen}
                aria-controls="mobile-machine-menu"
                onClick={() => {
                  setMachinesOpen((isOpen) => !isOpen);
                  setSpareOpen(false);
                }}
              >
                Products ▾
              </button>
              {machinesOpen && (
                <div className="mobile-spare-links" id="mobile-machine-menu">
                  <Link to="/products" onClick={closeMenus}>All Products / Machines</Link>
                  {machineCategories.map((category) => (
                    <Link
                      key={category._id || category.slug}
                      to={`/products/${category.slug}`}
                      onClick={closeMenus}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/catalog" onClick={closeMenus}>Catalog</Link>
            <Link to="/#contact" onClick={closeMenus}>Contact Us</Link>
            <Link to="/get-quote" className="btn-quote-mobile" onClick={closeMenus}>
              Get a Quote
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
