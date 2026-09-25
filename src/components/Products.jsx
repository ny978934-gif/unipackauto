import "./Products.css";
import { Link } from "react-router-dom";

const PRODUCTS = [
  {
    name: "Strapping Machines",
    desc: "Semi-automatic and fully automatic PET/PP strapping for cartons, pallets and bundles.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Sealing Machines",
    desc: "Continuous band sealers, foot-operated sealers and hand sealers for bags and pouches.",
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Vacuum Packaging Machines",
    desc: "Single, double and large-chamber vacuum packers for food and industrial use.",
    image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Stretch Wrapping Machines",
    desc: "Pallet wrapping systems built for high-throughput dispatch areas.",
    image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cup & Tray Sealers",
    desc: "Fast, consistent seals for pre-formed cups and trays on packing lines.",
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Conveyors & Material Handling",
    desc: "Motorized belt conveyors and idlers that connect your packaging stations.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Automatic Mattress Wrapping Machine",
    desc: "High-speed roll wrapping and sealing for mattresses with edge protection.",
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Pick Fill Sealing Machine",
    desc: "Integrated pick-fill-seal systems for precise portioned packaging.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Continuous Band Sealers",
    desc: "Reliable horizontal and vertical band sealers for high-volume lines.",
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Foil Sealers",
    desc: "Induction and foil sealing for tamper-evident caps and containers.",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Foot Operated Sealer",
    desc: "Simple, robust impulse sealers for bags, pouches and films.",
    image: "https://images.unsplash.com/photo-1607083206325-caf1edba7a0f?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Hand Sealing Machines",
    desc: "Portable impulse hand sealers for quick and clean bag sealing.",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mobile Sealing Machine",
    desc: "Trolley-mounted sealers for flexible on-site packing operations.",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Dispensing Machines",
    desc: "Precision dispensers for liquids, pastes and semi-solids.",
    image: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Bag Closer Machine",
    desc: "Portable bag closers with stitching heads for sacks and bulk bags.",
    image: "https://images.unsplash.com/photo-1601599561250-83a1a5b3e8b3?auto=format&fit=crop&w=800&q=80",
  },
];

export default function Products() {
  return (
    <section id="products" className="products">
      <div className="products__container">

        {/* Header */}
        <div className="products__header">
          <p className="products__kicker">What We Build</p>
          <h2 className="products__title">
            Machinery for every stage of the packing line
          </h2>
          <p className="products__subtitle">
            Fifteen core categories, each available in manual, semi-automatic
            and fully automatic configurations to match your line's volume.
          </p>
        </div>

        {/* Grid */}
        <div className="products__grid">
          {PRODUCTS.map((p, index) => (
            <article className="products__card" key={p.name}>
              <div className="products__image-box">
                <img
                  src={p.image}
                  alt={p.name}
                  className="products__image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="products__image-overlay" />
                <span className="products__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="products__body">
                <h3 className="products__name">{p.name}</h3>
                <p className="products__desc">{p.desc}</p>

                <Link to="/#contact" className="products__link">
                  Enquire about this
                  <svg
                    width="16"
                    height="16"
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
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}