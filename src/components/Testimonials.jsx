import React from "react";
import "./Testimonials.css";
import { FaQuoteRight, FaStar } from "react-icons/fa";

const testimonials = [
  {
    name: "Rajesh Sharma",
    role: "Plant Manager, Apex Packaging",
    initial: "R",
    text: "Unipackauto strapping machines have been running flawlessly in our facility for over 3 years. The build quality and after-sales support are exceptional.",
  },
  {
    name: "Priya Mehta",
    role: "Procurement Head, FreshFoods Ltd.",
    initial: "P",
    text: "We switched to Unipackauto vacuum packaging machines for our food products and the results have been outstanding. Shelf life improved significantly.",
  },
  {
    name: "Mohammed Ali",
    role: "Operations Director, GlobeEx Logistics",
    initial: "M",
    text: "The pallet stretch wrapping machine from Unipackauto has transformed our warehouse efficiency. Highly recommend their machinery.",
  },
  {
    name: "Anita Deshmukh",
    role: "Quality Head, MediPack Solutions",
    initial: "A",
    text: "Their sealing machines meet our strict pharma-grade standards. Every unit arrived calibrated and ready for production. Truly reliable partners.",
  },
  {
    name: "Vikram Singh",
    role: "Founder, SwiftWrap Industries",
    initial: "V",
    text: "From enquiry to installation, the Unipackauto team was responsive and professional. The continuous band sealers have cut our downtime by half.",
  },
];

const Testimonials = () => {
  // Duplicate the array so the marquee loops seamlessly
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="testimonials-container">

        {/* Top Badge */}
        <div className="testimonial-badge">
          <FaQuoteRight />
          <span>Client Testimonials</span>
        </div>

        {/* Heading */}
        <h2 className="testimonial-heading">What Our Clients Say</h2>

        <p className="testimonial-subtitle">
          Trusted by businesses across industries and borders — here's what our
          clients
          <br />
          have to say about working with Unipackauto.
        </p>

        {/* Continuous Marquee */}
        <div className="testimonial-marquee">
          <div className="testimonial-track">
            {marqueeItems.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>

                {/* Rating + Quote */}
                <div className="card-top">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar key={star} />
                    ))}
                  </div>

                  <div className="quote-icon">
                    <FaQuoteRight />
                  </div>
                </div>

                {/* Review */}
                <p className="testimonial-text">"{testimonial.text}"</p>

                {/* Divider */}
                <div className="testimonial-divider"></div>

                {/* User */}
                <div className="testimonial-user">
                  <div className="user-avatar">{testimonial.initial}</div>

                  <div className="user-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;