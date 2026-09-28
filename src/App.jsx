import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./components/pages/Home.jsx";
import SpareParts from "./components/pages/spareparts/SpareParts.jsx";
import SubCategory from "./components/pages/spareparts/SubCategory.jsx";
import SubSubCategory from "./components/pages/spareparts/SubSubCategory.jsx";
import ProductDetails from "./components/pages/spareparts/ProductDetails.jsx";
import Products from "./components/pages/spareparts/Products3.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import Dashboard from "./admin/Dashboard.jsx";
import Categories from "./admin/Categories.jsx";
import SubCategories from "./admin/SubCategories.jsx";
import AdminProducts from "./admin/Products2.jsx";
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

export default function App() {
  return (
    <BrowserRouter>
      <HashScroll />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Main Spare Parts page */}
          <Route path="/spare-parts" element={<SpareParts />} />
          {/* Sub Spare Parts list for selected category */}
          <Route path="/spare-parts/:categorySlug" element={<SubCategory />} />
          <Route path="/spare-parts/:categorySlug/:subCategorySlug" element={<SubSubCategory />} />
          <Route path="/spare-parts/:categorySlug/:subCategorySlug/:subSubCategorySlug" element={<Products />} />
          {/* Direct Product Details page */}
          {/* Nested Subcategory Product Details page */}
          <Route path="/spare-parts/:categorySlug/:subCategorySlug/:subSubCategorySlug/:productSlug" element={<ProductDetails />} />
          
          {/* Admin Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="subcategories" element={<SubCategories />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>

          {/* Product Catalog */}
          <Route path="/catalog" element={<Catalog />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
