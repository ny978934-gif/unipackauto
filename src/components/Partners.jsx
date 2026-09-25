import React from 'react';
import './Partners.css';
import sepackLogo from '../assests/image.png';
import sevanaLogo from '../assests/imk.PNG';
import frommLogo from '../assests/imm.PNG';
import cyklopLogo from '../assests/pl.PNG';

const PARTNERS = [
  {
    id: 1,
    name: 'SEPACK',
    logo: sepackLogo,
  },
  {
    id: 2,
    name: 'Sevana',
    logo: sevanaLogo,
  },
  {
    id: 3,
    name: 'FROMM Packaging Systems',
    logo: frommLogo,
  },
  {
    id: 4,
    name: 'CYKLOP',
    logo: cyklopLogo,
  },
];

export default function Partners() {
  return (
    <section id="partners" className="partners">
      <div className="partners__container">
        
        {/* Header Section */}
        <div className="partners__header">
          <div className="partners__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Channel Partners</span>
          </div>

          <h2 className="partners__title">Trusted by Industry Leaders</h2>
          
          <p className="partners__subtitle">
            We have joined hands with the most reliable vendors and brands in the market to deliver the best packaging solutions.
          </p>
        </div>

        {/* 4x2 Grid of Partner Cards */}
        <div className="partners__grid">
          {PARTNERS.map((partner) => (
            <div key={partner.id} className="partners__card">
              <div className="partners__logo-box">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="partners__logo"
                  onError={(e) => {
                    // Fallback to text icon if image URL fails to load
                    e.target.style.display = 'none';
                    e.target.parentNode.innerText = partner.name.charAt(0);
                  }}
                />
              </div>
              <span className="partners__name">{partner.name}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}