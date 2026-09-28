import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImageA from '../assests/a.jpg';
import heroImageB from '../assests/b.jpg';
import heroImageC from '../assests/c.jpg';
import heroImageD from '../assests/d.jpg';
import heroImageE from '../assests/e.jpg';
import './Hero.css';

const slides = [
  {
    title: 'Versatile Sciences for your Product',
    subtitle: 'We make adaptable packaging machines to suit any requirement.',
    image: heroImageA,
  },
  {
    title: 'Simply Breathtaking!',
    subtitle: 'Breathe out — precision sealing that never misses.',
    image: heroImageB,
  },
  {
    title: 'Big Change Starts Small',
    subtitle: 'The change catalyst for the packaging industry.',
    image: heroImageC,
  },
  {
    title: 'Setting Standards is our Passion',
    subtitle: 'Our products always stand apart from the rest.',
    image: heroImageD,
  },
  {
    title: 'When Dreams Grow Big',
    subtitle: 'Machines that support your bigger dreams.',
    image: heroImageE,
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  }, []);

  // Timer set to 3 seconds (3000ms)
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => {
        const active = i === index;
        const isPrev = i === (index - 1 + slides.length) % slides.length;

        // One directional scroll (Left to Right stream)
        let translateClass = 'translate-right';
        if (active) {
          translateClass = 'translate-center';
        } else if (isPrev) {
          translateClass = 'translate-left';
        }

        return (
          <div
            key={i}
            className={`slide-item ${translateClass}`}
            aria-hidden={!active}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="slide-image"
            />
            <div className="slide-overlay-radial" />
            <div className="slide-overlay-linear" />
          </div>
        );
      })}

      {/* Content */}
      <div className="hero-content-wrapper">
        <div className="hero-container">
          <div className="hero-text-block">
            <span className="hero-badge">
              <span className="badge-dot" />
              Packaging Machine Manufacturer
            </span>

            <h1 key={`title-${index}`} className="hero-title animate-fade-up">
              {slides[index].title}
            </h1>

            <p key={`sub-${index}`} className="hero-subtitle animate-fade-up-delay-1">
              {slides[index].subtitle}
            </p>

            <div key={`cta-${index}`} className="hero-actions animate-fade-up-delay-2">
              <Link to="/#products" className="btn btn-primary group">
                Find More
                <ArrowRight className="btn-icon" />
              </Link>
              <Link to="/#contact" className="btn btn-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="nav-arrow nav-arrow-prev"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={next}
        aria-label="Next slide"
        className="nav-arrow nav-arrow-next"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicator Dots */}
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`dot-item ${i === index ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="hero-counter">
        <span className="counter-current">{String(index + 1).padStart(2, '0')}</span>
        <span className="counter-divider">/</span>
        <span>{String(slides.length).padStart(2, '0')}</span>
      </div>

      {/* Scroll Hint */}
      <div className="hero-scroll-hint">
        <div className="scroll-line" />
        Scroll
      </div>
    </div>
  );
}