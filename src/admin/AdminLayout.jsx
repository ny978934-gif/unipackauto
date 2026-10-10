import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAdminToken } from "../spareApi";
import logo from "../assests/logo.jpeg";
import "./AdminLayout.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const logout = () => {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <aside className="admin-sidebar">

        <div className="admin-logo">
          <img src={logo} alt="Unipack Auto logo" />
        </div>

        <nav className="admin-nav">

          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>📁</span>
            Categories
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>⚙️</span>
            Spare Parts Management
          </NavLink>

          <NavLink
            to="/admin/machines"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>🏭</span>
            Products / Machines
          </NavLink>

          <NavLink
            to="/admin/inquiries"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>✉️</span>
            Inquiries
          </NavLink>

          <NavLink
            to="/admin/quote-requests"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>🧾</span>
            Quote Requests
          </NavLink>

          <NavLink
            to="/admin/spare-parts-uploader"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            <span>📊</span>
            Spare Parts Import
          </NavLink>

        </nav>

        <div className="admin-sidebar-bottom">
          <NavLink to="/" className="back-website">
            ← Back to Website
          </NavLink>
        </div>

      </aside>


      {/* Main Area */}
      <main className="admin-main">

        <header className="admin-header">

          <div>
            <h3>Dashboard</h3>
            <p>Manage your spare parts and machine catalogues</p>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">N</div>

            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
            </div>
            <button className="admin-logout-btn" type="button" onClick={logout}>Log out</button>
          </div>

        </header>

        <section className="admin-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
};

export default AdminLayout;