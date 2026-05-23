import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import ProductCard from "../components/common/ProductCard";
import { useAppContext } from "../context/AppContext";
import { useFavoriteStore } from "../store/favoriteStore";

const Favorites = () => {
  const { state } = useAppContext();
  const { favorites, fetchFavorites, loading } = useFavoriteStore();

  // Fetch favorites when component mounts and user is logged in
  useEffect(() => {
    if (state.user) {
      fetchFavorites();
    }
  }, [state.user, fetchFavorites]);

  // Convert favorites from store format to Product format for ProductCard
  const favoriteProducts = favorites
    .filter((fav) => fav && fav.product)
    .map((fav) => {
      const p = fav.product as {
        _id?: string;
        id?: string;
        name?: string;
        price?: number;
        originalPrice?: number;
        image?: string | string[];
        category?: string | { _id: string };
        description?: string;
        features?: string[];
        inStock?: boolean;
        isNew?: boolean;
        onSale?: boolean;
      };
      return {
        id: p?._id ?? String(p?.id ?? ""),
        name: p?.name ?? "",
        price: p?.price ?? 0,
        originalPrice: p?.originalPrice,
        image: Array.isArray(p?.image) ? p.image : [p?.image].filter(Boolean),
        category:
          typeof p?.category === "object" && p?.category?._id
            ? p.category._id
            : p?.category != null
            ? String(p.category)
            : "",
        description: p?.description ?? "",
        features: p?.features || [],
        inStock: Boolean(p?.inStock),
        isNew: Boolean(p?.isNew),
        onSale: Boolean(p?.onSale),
      };
    });

  if (!state.user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              My Favorites
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Your favorite products
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your favorite products.
            </p>
            <Link to="/login">
              <Button className="btn-primary">Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              My Favorites
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Loading your favorites...
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              My Favorites
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Your favorite products
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start browsing and save products you love by clicking the heart
              icon. Your favorites will appear here for easy access.
            </p>
            <Link to="/shop">
              <Button className="btn-primary">Discover Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">My Favorites</h1>
          <p className="text-xl text-primary-foreground/90">
            {favoriteProducts.length} saved{" "}
            {favoriteProducts.length === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Found everything you were looking for?
          </p>
          <Link to="/shop">
            <Button className="btn-outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Favorites;
