import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "../../context/AppContext";
import { useAppContext } from "../../context/AppContext";
import { useFavoriteStore } from "../../store/favoriteStore";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = "",
}) => {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { addToFavorites, removeFromFavorites, checkFavorite } =
    useFavoriteStore();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInCart = state.cart.some((item) => item.id === product.id);

  // Check if product is in favorites on component mount
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (state.user) {
        const favoriteStatus = await checkFavorite(product.id);
        setIsFavorite(favoriteStatus);
      }
    };
    checkIfFavorite();
  }, [product.id, state.user, checkFavorite]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: "ADD_TO_CART", product });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!state.user) {
      toast({
        title: "Login Required",
        description: "Please log in to add products to favorites.",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(product.id);
        setIsFavorite(false);
        toast({
          title: "Removed from Favorites",
          description: `${product.name} has been removed from your favorites.`,
        });
      } else {
        await addToFavorites(product.id);
        setIsFavorite(true);
        toast({
          title: "Added to Favorites",
          description: `${product.name} has been added to your favorites.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`card-product overflow-hidden group ${className}`}>
      <Link to={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && <Badge className="badge-new">NEW</Badge>}
            {product.onSale && <Badge className="badge-sale">SALE</Badge>}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-medium hover:scale-110 transition-transform"
              onClick={handleToggleFavorite}
              disabled={isLoading}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? "fill-destructive text-destructive" : ""
                }`}
              />
            </Button>
          </div>

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold bg-destructive px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <p className="text-sm text-muted-foreground mb-1">
            {product.category}
          </p>

          {/* Product Name */}
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-sm text-destructive font-semibold">
                -
                {Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100
                )}
                %
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="px-4 pb-4">
        <Button
          className="w-full btn-primary"
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isInCart ? "In Cart" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
