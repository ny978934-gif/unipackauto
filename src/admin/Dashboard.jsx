import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API, adminFetch } from "../spareApi";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    inquiries: 0,
    newInquiries: 0,
    quoteRequests: 0,
    newQuoteRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    adminFetch(`${API}/api/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch stats");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setStats({
            categories: data.categories || 0,
            products: data.products || 0,
            inquiries: data.inquiries || 0,
            newInquiries: data.newInquiries || 0,
            quoteRequests: data.quoteRequests || 0,
            newQuoteRequests: data.newQuoteRequests || 0,
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch dashboard stats, using fallback:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Live database inventory and catalogue management.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📁</div>
          <div>
            <span>Total Categories</span>
            <h2>{loading ? "..." : stats.categories}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">⚙️</div>
          <div>
            <span>Total Products</span>
            <h2>{loading ? "..." : stats.products}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">✉️</div>
          <div>
            <span>New Inquiries</span>
            <h2>{loading ? "..." : stats.newInquiries}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🧾</div>
          <div>
            <span>New Quote Requests</span>
            <h2>{loading ? "..." : stats.newQuoteRequests}</h2>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-grid">
          <Link to="/admin/categories" className="quick-card">
            <span>📁</span>
            <div>
              <h3>Manage Categories</h3>
              <p>Organize machine categories and spare-part subcategories</p>
            </div>
          </Link>

          <Link to="/admin/products" className="quick-card">
            <span>⚙️</span>
            <div>
              <h3>Manage Spare Parts</h3>
              <p>Add and manage spare-part names, categories, images, and pricing</p>
            </div>
          </Link>

          <Link to="/admin/spare-parts-uploader" className="quick-card">
            <span>📊</span>
            <div>
              <h3>Import Spare Parts</h3>
              <p>Upload Word or Excel files to add multiple parts</p>
            </div>
          </Link>

          <Link to="/admin/machines" className="quick-card">
            <span>🏭</span>
            <div>
              <h3>Manage Products / Machines</h3>
              <p>Add, edit, delete, or import machines and their catalogue details</p>
            </div>
          </Link>

          <Link to="/admin/inquiries" className="quick-card">
            <span>✉️</span>
            <div>
              <h3>View Inquiries</h3>
              <p>{stats.inquiries} total · {stats.newInquiries} new customer messages</p>
            </div>
          </Link>

          <Link to="/admin/quote-requests" className="quick-card">
            <span>🧾</span>
            <div>
              <h3>Manage Quote Requests</h3>
              <p>{stats.quoteRequests} total · {stats.newQuoteRequests} new machine and spare-part requests</p>
            </div>
          </Link>
        </div>
      </div>

      {/* STRUCTURE */}
      <div className="structure-card">
        <h2>Catalog Structure</h2>
        <div className="structure-flow">
          <div className="structure-item">
            <span>📁</span>
            <strong>Main Category</strong>
            <small>Machine name (e.g. Strapping)</small>
          </div>

          <div className="arrow">→</div>

          <div className="structure-item">
            <span>🗂️</span>
            <strong>Subcategory</strong>
            <small>Optional spare-part grouping</small>
          </div>

          <div className="arrow">→</div>

          <div className="structure-item">
            <span>⚙️</span>
            <strong>Spare Part</strong>
            <small>Name, image, UOM, and price</small>
          </div>

          <div className="arrow">→</div>

          <div className="structure-item">
            <span>📄</span>
            <strong>Detail Page</strong>
            <small>Price, specifications, and inquiry details</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;