import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Send, Music } from "lucide-react";
import logo from "../../../public/favicon.ico";

const Footer = () => {
  return (
    <footer className="bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-bold text-accent-foreground text-xl">
                <img src={logo} alt="logo" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Mule Mobile</h3>
                <p className="text-xs text-primary-foreground/70">
                  Electronics & Mobile Store
                </p>
              </div>
            </div>
            <p className="text-primary-foreground/80 mb-4">
              Locally selling and maintaining Mobile Phones and Electronics in
              Ethiopia; particularly Addis Ababa. We are here to help, serve,
              and solve all your mobile phones problem and electronics.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-primary-foreground/70 hover:text-accent transition-colors"
                aria-label="TikTok"
              >
                Tiktok
              </a>
              <a
                href="https://t.me/mulemobile5"
                className="text-primary-foreground/70 hover:text-accent transition-colors"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/shop"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/shop?category=Mobile Phones"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Mobile Phones
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=Televisions"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Televisions
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=Speakers"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Speakers
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=Smart Watches"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Smart Watches
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=Accessories"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-primary-foreground/80">
                    Addis Ababa, Ethiopia
                    <br />
                    location
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-accent" />
                <a
                  href="tel:+251924700259"
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  +251924700259
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-accent" />
                <p className="text-primary-foreground/80">
                  mulemobile555@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-light/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60">
            © 2025 Mule Mobile. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
