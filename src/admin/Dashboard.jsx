import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../spareApi";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    subcategories: 0,
    products: 0,
    inStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API}/api/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch stats");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setStats({
            categories: data.categories || 0,
            subcategories: data.subcategories || 0,
            products: data.products || 0,
            inStock: data.inStock || 0,
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
          <p>Welcome to Unipack Auto Admin Panel — Live Database Inventory</p>
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
          <div className="stat-icon pink">📂</div>
          <div>
            <span>Sub Categories</span>
            <h2>{loading ? "..." : stats.subcategories}</h2>
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
          <div className="stat-icon green">📦</div>
          <div>
            <span>In Stock</span>
            <h2>{loading ? "..." : stats.inStock}</h2>
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
              <p>Add, edit or delete machine categories</p>
            </div>
          </Link>

          <Link to="/admin/subcategories" className="quick-card">
            <span>📂</span>
            <div>
              <h3>Manage Sub Categories</h3>
              <p>Organize spare parts groups</p>
            </div>
          </Link>

          <Link to="/admin/products" className="quick-card">
            <span>⚙️</span>
            <div>
              <h3>Manage Products</h3>
              <p>Add new spare parts, pricing &amp; codes</p>
            </div>
          </Link>
        </div>
      </div>

      {/* STRUCTURE */}
      <div className="structure-card">
        <h2>Spare Parts Structure</h2>
        <div className="structure-flow">
          <div className="structure-item">
            <span>📁</span>
            <strong>Category</strong>
            <small>Machine Model (e.g. Strapping)</small>
          </div>

          <div className="arrow">→</div>

          <div className="structure-item">
            <span>📂</span>
            <strong>Sub Category</strong>
            <small>Component Group (e.g. Separating Plate)</small>
          </div>

          <div className="arrow">→</div>

          <div className="structure-item">
            <span>⚙️</span>
            <strong>Product</strong>
            <small>Spare Part (e.g. Separating Plate China)</small>
          </div>

          <div className="arrow">→</div>

          <div className="structure-item">
            <span>📄</span>
            <strong>Details</strong>
            <small>Price, Code, Specs, Inquiry</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;