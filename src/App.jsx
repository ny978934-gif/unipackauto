import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./components/pages/Home.jsx";
import SpareParts from "./components/pages/spareparts/SpareParts.jsx";
import MachineProducts from "./components/pages/products/Products.jsx";
import SubCategory from "./components/pages/spareparts/SubCategory.jsx";
import SubSubCategory from "./components/pages/spareparts/SubSubCategory.jsx";
import ProductDetails from "./components/pages/spareparts/ProductDetails.jsx";
import Products from "./components/pages/spareparts/Products3.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import Dashboard from "./admin/Dashboard.jsx";
import Categories from "./admin/Categories.jsx";
import SubCategories from "./admin/SubCategories.jsx";
import AdminProducts from "./admin/Products2.jsx";
import DocumentUploader from "./admin/DocumentUploader.jsx";
import Catalog from "./components/catalog.jsx";
import "./components/UnifiedTheme.css";

function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const scrollToHash = () => {
      const target = document.querySelector(location.hash);
      if (!target) return;

      const navbarHeight = document.querySelector(".navbar-container-outer")?.offsetHeight || 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    };

    const timer = window.setTimeout(scrollToHash, 40);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return null;
}

// Wraps all routes — hides public Navbar/Footer on admin pages
function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<MachineProducts />} />
          <Route path="/products/:categorySlug" element={<SubCategory type="machine" />} />
          <Route path="/products/:categorySlug/:subCategorySlug" element={<SubSubCategory type="machine" />} />
          <Route path="/products/:categorySlug/:subCategorySlug/:subSubCategorySlug" element={<Products type="machine" />} />
          <Route path="/products/:categorySlug/:subCategorySlug/:subSubCategorySlug/:productSlug" element={<ProductDetails type="machine" />} />
          {/* Spare Parts */}
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/spare-parts/:categorySlug" element={<SubCategory />} />
          <Route path="/spare-parts/:categorySlug/:subCategorySlug" element={<SubSubCategory />} />
          <Route path="/spare-parts/:categorySlug/:subCategorySlug/:subSubCategorySlug" element={<Products />} />
          <Route path="/spare-parts/:categorySlug/:subCategorySlug/:subSubCategorySlug/:productSlug" element={<ProductDetails />} />
          {/* Admin Portal — renders its own sidebar/header, no public nav */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="subcategories" element={<SubCategories />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="machines" element={<AdminProducts type="machine" />} />
            <Route path="document-uploader" element={<DocumentUploader />} />
          </Route>
          {/* Product Catalog */}
          <Route path="/catalog" element={<Catalog />} />
          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HashScroll />
      <AppShell />
    </BrowserRouter>
  );
}
