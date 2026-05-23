import React from "react";
import { Link } from "react-router-dom";
import { Users, Award, MapPin, Heart, Phone, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import image from "../../public/photo_2025-12-08_19-23-07.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About
            <span className="text-accent block">Mule Mobile</span>
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Your trusted partner for mobile phones, electronics, and
            professional repair services in the heart of Addis Ababa, Ethiopia.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  Founded in the bustling city of Addis Ababa, Mule Mobile has
                  been serving the Ethiopian community with quality electronics
                  and exceptional repair services. We understand the importance
                  of staying connected in today's digital world.
                </p>
                <p>
                  Our journey began with a simple mission: to provide
                  affordable, high-quality mobile phones and electronics while
                  offering professional repair services that our customers can
                  trust. We believe in building lasting relationships with our
                  community through honest service and fair pricing.
                </p>
                <p>
                  Today, we're proud to be one of Addis Ababa's most trusted
                  electronics stores, known for our extensive product range,
                  expert repair services, and commitment to customer
                  satisfaction.
                </p>
              </div>
            </div>
            <div className="lg:text-center">
              <div className="relative">
                <div className="w-80 h-80 mx-auto bg-accent/20 rounded-2xl flex items-center justify-center">
                  <img
                    src={image}
                    alt="Mule"
                    className="rounded-2xl mt-5 shadow-2xl "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-elevated p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To provide the Ethiopian community with access to the latest
                technology, quality electronics, and professional repair
                services at affordable prices. We strive to bridge the digital
                divide and keep our customers connected to what matters most.
              </p>
            </div>

            <div className="card-elevated p-8 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become Ethiopia's leading electronics retailer and repair
                service provider, known for innovation, reliability, and
                exceptional customer service. We envision a future where
                technology enhances every Ethiopian's daily life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Do</h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive electronics solutions for all your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center card-elevated p-8">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3">Electronics Retail</h3>
              <p className="text-muted-foreground mb-4">
                Latest mobile phones, televisions, speakers, smart watches, and
                accessories from top brands at competitive prices.
              </p>
              <Link to="/shop">
                <Button variant="outline" size="sm">
                  Shop Now
                </Button>
              </Link>
            </div>

            <div className="text-center card-elevated p-8">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-3">Repair Services</h3>
              <p className="text-muted-foreground mb-4">
                Professional repair services for mobile phones and electronics
                with genuine parts and warranty coverage.
              </p>
              <Link to="/services">
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="text-center card-elevated p-8">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold mb-3">Spare Parts</h3>
              <p className="text-muted-foreground mb-4">
                Genuine spare parts for all mobile phone brands and models,
                ensuring quality replacements for your devices.
              </p>
              <Link to="/contact">
                <Button variant="outline" size="sm">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                2000+
              </div>
              <div className="text-primary-foreground/80">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                5+
              </div>
              <div className="text-primary-foreground/80">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                6000+
              </div>
              <div className="text-primary-foreground/80">Devices sold</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                98%
              </div>
              <div className="text-primary-foreground/80">
                Satisfaction Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Quality First",
                description:
                  "We never compromise on the quality of our products and services.",
                icon: "⭐",
              },
              {
                title: "Fair Pricing",
                description:
                  "Affordable prices without hidden costs or surprise fees.",
                icon: "💰",
              },
              {
                title: "Expert Service",
                description:
                  "Professional, knowledgeable staff ready to help you.",
                icon: "👨‍🔧",
              },
              {
                title: "Community Focus",
                description:
                  "Supporting and serving the local Ethiopian community.",
                icon: "🤝",
              },
            ].map((value, index) => (
              <div key={index} className="text-center card-elevated p-6">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Visit Our Store
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p className="text-muted-foreground">
                      location
                      <br />
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Users className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Our Team</h3>
                    <p className="text-muted-foreground">
                      Experienced technicians and friendly customer service
                      staff ready to assist you with all your electronics needs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/contact">
                  <Button className="btn-primary">
                    Get Directions
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" className="btn-outline">
                  <Phone className="mr-2 h-5 w-5" />
                  +251-924-700259
                </Button>
              </div>
            </div>
            <div className="lg:text-center">
              <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d382.82888090328504!2d38.859346793522135!3d9.020139488981112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b9b513d984d09%3A0xc68ba9002154dc54!2sMule%20Mobile!5e1!3m2!1sen!2set!4v1765211902997!5m2!1sen!2set"
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience the Difference?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Mule Mobile for
            their electronics needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button className="btn-hero">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                className="btn-outline border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary"
              >
                Visit Our Store
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
