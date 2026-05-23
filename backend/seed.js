// seed.js
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");
const Category = require("./models/Catagory");
const Service = require("./models/Service");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

// Paste the updated mock data here (from frontend/src/data/mockData.ts)
const categories = [
  "Mobile Phones",
  "Televisions",
  "Speakers",
  "Headphones & Earphones",
  "Accessories",
  "Chargers",
  "Cables & Batteries",
  "Smart Watches",
  "Storage",
  "TV Accessories",
  "Mobile Cases",
];

const mockProducts = [
  {
    name: "iPhone 15 Pro Max",
    price: 89999,
    originalPrice: 94999,
    image: [
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
    ],
    category: { name: "Mobile Phones" },
    description: "Latest iPhone with advanced A17 Pro chip and titanium design",
    features: ["A17 Pro Chip", "48MP Camera", "5G Ready", "128GB Storage"],
    inStock: true,
    isNew: true,
    onSale: true,
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    price: 79999,
    image: [
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
    ],
    category: { name: "Mobile Phones" },
    description:
      "Flagship Samsung phone with S Pen and incredible camera system",
    features: ["200MP Camera", "S Pen Included", "12GB RAM", "256GB Storage"],
    inStock: true,
    isNew: true,
  },
  {
    name: "Google Pixel 8 Pro",
    price: 65999,
    image: [
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
      "https://istore.co.na/cdn/shop/products/iPhone14ProMax_Gold_c659f951-d1e7-4658-8836-b0ddc4be58ba_1200x.png?v=1664271565",
    ],
    category: { name: "Mobile Phones" },
    description: "Pure Android experience with AI-powered photography",
    features: ["AI Photography", "Pure Android", "12GB RAM", "128GB Storage"],
    inStock: true,
  },
  {
    name: 'LG OLED 55" 4K Smart TV',
    price: 125999,
    originalPrice: 139999,
    image: [
      "https://www.lg.com/africa/images/tvs/md07555493/gallery/D-L-01.jpg",
      "https://www.lg.com/africa/images/tvs/md07555493/gallery/D-L-01.jpg",
      "https://www.lg.com/africa/images/tvs/md07555493/gallery/D-L-01.jpg",
    ],
    category: { name: "Televisions" },
    description: "Premium OLED display with perfect blacks and vibrant colors",
    features: ["OLED Display", "4K HDR", "Smart TV", "Dolby Vision"],
    inStock: true,
    onSale: true,
  },
  {
    name: 'Samsung 65" QLED 4K TV',
    price: 89999,
    image: [
      "https://www.lg.com/africa/images/tvs/md07555493/gallery/D-L-01.jpg",
      "https://www.lg.com/africa/images/tvs/md07555493/gallery/D-L-01.jpg",
      "https://www.lg.com/africa/images/tvs/md07555493/gallery/D-L-01.jpg",
    ],
    category: { name: "Televisions" },
    description: "Quantum Dot technology for incredible color accuracy",
    features: ["QLED Technology", "4K Resolution", "Tizen OS", "65 Inch"],
    inStock: true,
  },
  {
    name: "JBL Charge 5 Bluetooth Speaker",
    price: 8999,
    image: [
      "https://iprsoftwaremedia.com/214/files/20210/5ff4db7b2cfac225067e94de_JBL%20Charge%205/JBL%20Charge%205_mid.jpg",
      "https://iprsoftwaremedia.com/214/files/20210/5ff4db7b2cfac225067e94de_JBL%20Charge%205/JBL%20Charge%205_mid.jpg",
      "https://iprsoftwaremedia.com/214/files/20210/5ff4db7b2cfac225067e94de_JBL%20Charge%205/JBL%20Charge%205_mid.jpg",
    ],
    category: { name: "Speakers" },
    description: "Powerful portable speaker with 20-hour battery life",
    features: ["20H Battery", "Waterproof", "Bluetooth 5.1", "PartyBoost"],
    inStock: true,
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    price: 24999,
    originalPrice: 29999,
    image: [
      "https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp",
      "https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp",
      "https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp",
    ],
    category: { name: "Headphones & Earphones" },
    description: "Industry-leading noise canceling with premium sound quality",
    features: [
      "Active Noise Canceling",
      "30H Battery",
      "Quick Charge",
      "Multipoint",
    ],
    inStock: true,
    onSale: true,
    isNew: true,
  },
  {
    name: "Apple Watch Series 9",
    price: 34999,
    image: [
      "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png",
      "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png",
      "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png",
    ],
    category: { name: "Smart Watches" },
    description:
      "Advanced health monitoring with the most powerful Apple Watch yet",
    features: [
      "Health Monitoring",
      "Always-On Display",
      "Water Resistant",
      "GPS",
    ],
    inStock: true,
    isNew: true,
  },
  {
    name: "Samsung Galaxy Watch6",
    price: 28999,
    image: [
      "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png",
      "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png",
      "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png",
    ],
    category: { name: "Smart Watches" },
    description:
      "Comprehensive health and fitness tracking with long battery life",
    features: ["Health Tracking", "3-Day Battery", "Sleep Coaching", "GPS"],
    inStock: true,
  },
  {
    name: "Anker PowerBank 20000mAh",
    price: 4999,
    image: [
      "https://i.pcmag.com/imagery/reviews/04yfR3CU1nuOPG61J3KtwTN-3.fit_scale.size_1028x578.v1569477694.jpg",
      "https://i.pcmag.com/imagery/reviews/04yfR3CU1nuOPG61J3KtwTN-3.fit_scale.size_1028x578.v1569477694.jpg",
      "https://i.pcmag.com/imagery/reviews/04yfR3CU1nuOPG61J3KtwTN-3.fit_scale.size_1028x578.v1569477694.jpg",
    ],
    category: { name: "Chargers" },
    description: "High-capacity power bank with fast charging for all devices",
    features: [
      "20000mAh Capacity",
      "Fast Charging",
      "Multiple Ports",
      "LED Display",
    ],
    inStock: true,
  },
  {
    name: "USB-C to Lightning Cable",
    price: 1999,
    image: [
      "https://img.drz.lazcdn.com/static/pk/p/c4a5528b2d1f062814c75e1c913d920c.jpg_720x720q80.jpg",
      "https://img.drz.lazcdn.com/static/pk/p/c4a5528b2d1f062814c75e1c913d920c.jpg_720x720q80.jpg",
      "https://img.drz.lazcdn.com/static/pk/p/c4a5528b2d1f062814c75e1c913d920c.jpg_720x720q80.jpg",
    ],
    category: { name: "Cables & Batteries" },
    description: "Premium quality cable for iPhone charging and data transfer",
    features: ["Fast Charging", "Data Transfer", "Durable Design", "2m Length"],
    inStock: true,
  },
  {
    name: "iPhone 15 Pro Leather Case",
    price: 3999,
    image: [
      "https://bandwerk.com/cdn/shop/files/Aluminium-Leder-Huelle-Pro-Max-MokkaBraun01.webp?v=1723995262",
      "https://bandwerk.com/cdn/shop/files/Aluminium-Leder-Huelle-Pro-Max-MokkaBraun01.webp?v=1723995262",
      "https://bandwerk.com/cdn/shop/files/Aluminium-Leder-Huelle-Pro-Max-MokkaBraun01.webp?v=1723995262",
    ],
    category: { name: "Mobile Cases" },
    description: "Premium leather case with perfect fit and protection",
    features: [
      "Genuine Leather",
      "Perfect Fit",
      "Drop Protection",
      "Wireless Charging",
    ],
    inStock: true,
  },
];

const services = [
  {
    title: "Mobile Spare Parts",
    description: "Genuine spare parts for all mobile phone brands and models",
    icon: "📱",
    features: [
      "Original Parts",
      "All Brands",
      "Quality Guarantee",
      "Competitive Prices",
    ],
  },
  {
    title: "Mobile Maintenance",
    description:
      "Professional repair and maintenance services for your devices",
    icon: "🔧",
    features: [
      "Expert Technicians",
      "Quick Service",
      "Warranty Included",
      "Diagnostic Tools",
    ],
  },
  {
    title: "Screen Replacement",
    description: "High-quality screen replacement for damaged mobile displays",
    icon: "📱",
    features: [
      "OEM Quality",
      "Same Day Service",
      "6 Month Warranty",
      "All Models",
    ],
  },
  {
    title: "Charge Connector Repairs",
    description: "Fix charging port issues and connectivity problems",
    icon: "🔌",
    features: [
      "Professional Repair",
      "Original Connectors",
      "Testing Included",
      "Fast Turnaround",
    ],
  },
];

async function seed() {
  await connectDB();
  try {
    // Clear collections
    await Product.deleteMany();
    await Category.deleteMany();
    await Service.deleteMany();

    // Insert categories
    const categoryDocs = await Category.insertMany(
      categories.map((name) => ({ name })),
    );
    const categoryMap = {};
    categoryDocs.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Insert products (map category name to ObjectId)
    const productsToInsert = mockProducts.map((prod) => ({
      ...prod,
      category: categoryMap[prod.category.name],
    }));
    await Product.insertMany(productsToInsert);

    // Insert services
    await Service.insertMany(services);

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = new User({
      name: "Admin User",
      email: "admin@mule.com",
      password: adminPassword,
      role: "admin",
      phone: "0911223344",
      isActive: true,
    });
    await adminUser.save();

    console.log("✅ Database seeded successfully!");
    console.log("🔑 Admin credentials:");
    console.log("   Email: admin@example.com");
    console.log("   Password: admin123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
