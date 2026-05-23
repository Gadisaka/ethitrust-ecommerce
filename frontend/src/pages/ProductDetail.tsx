import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import ProductCard from "../components/common/ProductCard";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../hooks/use-toast";
import { useProductStore } from "../store/productStore";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products, fetchProducts]);

  const product = products.find((p) => p._id === id);

  console.log("ProductDetail - Looking for product with id:", id);
  console.log(
    "ProductDetail - Available products:",
    products.map((p) => ({ id: p._id, name: p.name }))
  );
  console.log("ProductDetail - Found product:", product);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFavorite = state.favorites.some(
    (fav) => (fav.id || fav.id) === (product._id || product._id)
  );
  const cartItem = state.cart.find(
    (item) => (item.id || item.id) === (product._id || product._id)
  );
  const isInCart = !!cartItem;

  const relatedProducts = products
    .filter(
      (p) =>
        (typeof p.category === "string" ? p.category : p.category?.name) ===
          (typeof product.category === "string"
            ? product.category
            : product.category?.name) && p._id !== product._id
    )
    .slice(0, 4);

  // Images for gallery
  const productImages = Array.isArray(product.image)
    ? product.image
    : [product.image];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch({
        type: "ADD_TO_CART",
        product: {
          ...product,
          id: product._id,
          category:
            typeof product.category === "string"
              ? product.category
              : product.category?.name || "",
        },
      });
    }
    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.name}${
        quantity > 1 ? "s" : ""
      } added to your cart.`,
    });
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      dispatch({
        type: "REMOVE_FROM_FAVORITES",
        productId: product._id || product._id,
      });
      toast({
        title: "Removed from Favorites",
        description: `${product.name} has been removed from your favorites.`,
      });
    } else {
      dispatch({
        type: "ADD_TO_FAVORITES",
        product: {
          ...product,
          id: product._id,
          category:
            typeof product.category === "string"
              ? product.category
              : product.category?.name || "",
        },
      });
      toast({
        title: "Added to Favorites",
        description: `${product.name} has been added to your favorites.`,
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      const shareTitle = product.name;
      const shareText = `Check out ${product.name} on Mule Mobile`;

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: "Thanks for sharing!",
          description: "We appreciate you spreading the word.",
        });
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "Product link copied to clipboard.",
        });
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        toast({
          title: "Link copied",
          description: "Product link copied to clipboard.",
        });
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      toast({
        title: "Unable to share",
        description: "Please copy the URL manually and share.",
      });
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
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              to="/shop"
              className="text-muted-foreground hover:text-primary"
            >
              Shop
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              to={`/shop?category=${encodeURIComponent(
                typeof product.category === "string"
                  ? product.category
                  : product.category?.name || ""
              )}`}
              className="text-muted-foreground hover:text-primary"
            >
              {typeof product.category === "string"
                ? product.category
                : product.category?.name}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 bg-secondary rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2">
              {product.isNew && <Badge className="badge-new">NEW</Badge>}
              {product.onSale && <Badge className="badge-sale">SALE</Badge>}
              {!product.inStock && (
                <Badge variant="destructive">OUT OF STOCK</Badge>
              )}
            </div>

            {/* Title and Category */}
            <div>
              <p className="text-muted-foreground mb-2">
                {typeof product.category === "string"
                  ? product.category
                  : product.category?.name}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge variant="destructive">
                    -
                    {Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )}
                    %
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {product.description}
            </p>

            {/* Features */}
            <div>
              <h3 className="font-semibold mb-3">Key Features:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!product.inStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="btn-primary flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isInCart ? `In Cart (${cartItem?.quantity})` : "Add to Cart"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className="h-12 w-12"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorite ? "fill-destructive text-destructive" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleShare}
                  aria-label="Share product"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            <div
              className={`p-4 rounded-lg ${
                product.inStock
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {product.inStock ? "✅ In Stock" : "❌ Out of Stock"}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="card-elevated p-6">
                <p className="text-lg leading-relaxed mb-4">
                  {product.description}
                </p>
                <p className="text-muted-foreground">
                  This product comes with full warranty and professional
                  support. All items are genuine and sourced directly from
                  authorized distributors.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="mt-6">
              <div className="card-elevated p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b border-border pb-2"
                    >
                      <span className="font-medium">{feature}:</span>
                      <span className="text-muted-foreground">Available</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related._id}
                  product={{
                    ...related,
                    id: related._id,
                    category:
                      typeof related.category === "string"
                        ? related.category
                        : related.category?.name || "",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
