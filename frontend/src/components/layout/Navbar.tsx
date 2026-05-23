import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, Menu, X, Search } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useProductStore } from "../../store/productStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import ProductCard from "../common/ProductCard";
import logo from "../../../public/favicon.ico";

const Navbar = () => {
  const { state } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const {
    products,
    searchResults,
    searchProducts,
    clearSearch,
    fetchProducts,
  } = useProductStore();

  const cartItemsCount = state.cart.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const favoritesCount = state.favorites.length;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    { path: "/services", label: "Services" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActiveLink = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Fetch products on component mount
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      console.log("Searching for:", query);
      searchProducts(query);
      console.log("Search results after search:", searchResults);
      setShowSearchResults(true);
    } else {
      clearSearch();
      setShowSearchResults(false);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Search result clicked, productId:", productId);
    console.log("About to navigate to:", `/product/${productId}`);

    // Close search results immediately
    setShowSearchResults(false);
    setSearchQuery("");
    clearSearch();

    // Navigate to product detail
    navigate(`/product/${productId}`);
    console.log("Navigation called");
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery("");
      clearSearch();
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log("Click outside detected");
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        console.log("Closing search results");
        // Add a small delay to allow click events to fire first
        setTimeout(() => {
          setShowSearchResults(false);
        }, 100);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gradient-primary shadow-medium sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="hidden md:flex justify-between items-center py-2 text-sm text-primary-foreground/80 border-b border-primary-light/20">
          <div className="flex items-center gap-6">
            <span>📍 Addis Ababa, Ethiopia</span>
            <span>📞 +251-924-700259</span>
          </div>
          <div className="flex items-center gap-4">
            {/* <span>Free shipping on orders over 5000 ETB</span> */}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-bold text-accent-foreground text-xl">
              <img src={logo} alt="logo" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">
                Mule Mobile
              </h1>
              <p className="text-xs text-primary-foreground/70">
                Electronics & Mobile Store
              </p>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-white/20"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/60 h-4 w-4" />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
                  onClick={(e) => {
                    console.log("Search dropdown container clicked");
                    e.stopPropagation();
                  }}
                >
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Search Results ({searchResults.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {searchResults.slice(0, 5).map((product) => {
                        console.log(
                          "Rendering search result:",
                          product._id,
                          product.name
                        );
                        return (
                          <div
                            key={product._id}
                            onClick={(e) => {
                              console.log("Desktop search result div clicked");
                              handleSearchResultClick(product._id, e);
                            }}
                            onMouseDown={(e) => {
                              console.log("Desktop search result mouse down");
                            }}
                            onMouseUp={(e) => {
                              console.log("Desktop search result mouse up");
                            }}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                            style={{ pointerEvents: "auto", zIndex: 1000 }}
                          >
                            <img
                              src={product.image[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <p className="text-sm text-gray-500 truncate">
                                {typeof product.category === "string"
                                  ? product.category
                                  : product.category?.name || ""}
                              </p>
                              <p className="text-sm font-semibold text-primary">
                                {new Intl.NumberFormat("en-ET", {
                                  style: "currency",
                                  currency: "ETB",
                                  minimumFractionDigits: 0,
                                }).format(product.price)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {searchResults.length > 5 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="submit"
                          className="w-full text-sm text-primary hover:text-primary-dark font-medium"
                        >
                          View all {searchResults.length} results
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-primary-foreground hover:text-accent transition-colors font-medium ${
                  isActiveLink(link.path) ? "text-accent" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* User Account */}
            {!state.user ? (
              <Link to="/login" className="hidden md:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground hover:text-accent hover:bg-white/10"
                >
                  <User className="h-5 w-5" />
                  <span className="ml-2 hidden xl:inline">Login</span>
                </Button>
              </Link>
            ) : (
              <Link to="/profile" className="hidden md:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground hover:text-accent hover:bg-white/10"
                >
                  <User className="h-5 w-5" />
                  <span className="ml-2 hidden xl:inline">
                    {state.user.name}
                  </span>
                </Button>
              </Link>
            )}

            {/* Favorites */}
            <Link to="/favorites" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:text-accent hover:bg-white/10"
              >
                <Heart className="h-5 w-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-bounce-in">
                    {favoritesCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Shopping Cart */}
            <Link to="/cart" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:text-accent hover:bg-white/10"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-bounce-in">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-primary-foreground hover:text-accent hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-white/20"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/60 h-4 w-4" />

            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50"
                onClick={(e) => {
                  console.log("Mobile search dropdown container clicked");
                  e.stopPropagation();
                }}
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {searchResults.slice(0, 3).map((product) => {
                      console.log(
                        "Rendering mobile search result:",
                        product._id,
                        product.name
                      );
                      return (
                        <div
                          key={product._id}
                          onClick={(e) => {
                            console.log("Mobile search result div clicked");
                            handleSearchResultClick(product._id, e);
                          }}
                          onMouseDown={(e) => {
                            console.log("Mobile search result mouse down");
                          }}
                          onMouseUp={(e) => {
                            console.log("Mobile search result mouse up");
                          }}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          style={{ pointerEvents: "auto", zIndex: 1000 }}
                        >
                          <img
                            src={product.image[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                              {typeof product.category === "string"
                                ? product.category
                                : product.category?.name || ""}
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              {new Intl.NumberFormat("en-ET", {
                                style: "currency",
                                currency: "ETB",
                                minimumFractionDigits: 0,
                              }).format(product.price)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {searchResults.length > 3 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        type="submit"
                        className="w-full text-sm text-primary hover:text-primary-dark font-medium"
                      >
                        View all {searchResults.length} results
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-primary-dark border-t border-primary-light/20">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-primary-foreground hover:text-accent transition-colors font-medium py-2 ${
                  isActiveLink(link.path) ? "text-accent" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-primary-light/20">
              {!state.user ? (
                <Link
                  to="/login"
                  className="flex items-center text-primary-foreground hover:text-accent transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  Login / Sign Up
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="flex items-center text-primary-foreground hover:text-accent transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  {state.user.name}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
