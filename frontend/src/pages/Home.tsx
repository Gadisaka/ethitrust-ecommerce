import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Truck, Headphones, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import ProductCard from "../components/common/ProductCard";
import { useProductStore } from "../store/productStore";
import { useCategoryStore } from "../store/categoryStore";
import image from "../../public/products.png";

const Home = () => {
  const { products, fetchProducts } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Optionally, filter featured products if you have a flag
  const featuredProducts = products.filter(
    (product) => product.isNew || product.onSale
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Your Trusted
                <span className="text-accent block">Electronics Store</span>
                in Addis Ababa
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                Discover the latest mobile phones, electronics, and premium
                accessories. Professional repair services and genuine spare
                parts for all your devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/shop">
                  <Button className="btn-hero text-lg px-8 py-4">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button
                    variant="outline"
                    className="btn-outline text-lg px-8 py-4 border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary"
                  >
                    Our Services
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:text-center hidden md:flex animate-slide-up">
              <div className="relative">
                <div className="w-[450px] h-[450px] mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                  <div className="w-[400px] h-[400px] bg-accent/30 rounded-full flex items-center justify-center">
                    <div className="w-[350px] h-[350px] bg-accent rounded-full flex items-center justify-center text-6xl">
                      <img
                        src={image}
                        alt="products"
                        className="absolute top- right- w-[500px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center card-elevated p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Guarantee</h3>
              <p className="text-muted-foreground">
                All products come with warranty and quality assurance. Genuine
                parts only.
              </p>
            </div>
            <div className="text-center card-elevated p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Quick delivery within Addis Ababa.
              </p>
            </div>
            <div className="text-center card-elevated p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Support</h3>
              <p className="text-muted-foreground">
                Professional repair services and technical support for all
                devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our latest and most popular products with amazing deals
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={{
                  ...product,
                  id: product._id,
                  category:
                    typeof product.category === "string"
                      ? product.category
                      : product.category?.name || "",
                }}
                className="animate-fade-in"
              />
            ))}
          </div>
          <div className="text-center">
            <Link to="/shop">
              <Button className="btn-primary text-lg px-8 py-4">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-muted-foreground">
              Find exactly what you're looking for
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category._id}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="card-elevated p-6 text-center hover:shadow-medium transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">
                  {index === 0 && "📱"}
                  {index === 1 && "📺"}
                  {index === 2 && "🔊"}
                  {index === 3 && "🎧"}
                  {index === 4 && "🔌"}
                  {index === 5 && "🔋"}
                  {index === 6 && "🔌"}
                  {index === 7 && "⌚"}
                  {index === 8 && "💾"}
                  {index === 9 && "📡"}
                  {index === 10 && "📱"}
                  {index === 11 && "⌚"}
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
