import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Smartphone,
  Monitor,
  Shield,
  Clock,
  Star,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useServiceStore } from "../store/serviceStore";
import type { Service } from "../store/serviceStore";

const iconMap: Record<string, React.ReactNode> = {
  repair: <Wrench className="h-8 w-8" />, // fallback
  // Add more mappings if your backend provides an icon key
};

const Services = () => {
  const { services, fetchServices } = useServiceStore();

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Professional
            <span className="text-accent block">Repair Services</span>
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Expert technicians providing quality repair services for all your
            mobile phones and electronic devices in Addis Ababa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="btn-hero">
                Book Service Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="btn-outline border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <a href="tel:+251924700259">
                <Phone className="mr-2 h-5 w-5" />
                Call +251-924-700259
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From spare parts to complete repairs, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service: Service) => (
              <Card
                key={service._id}
                className="card-elevated hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">
                    {/* Use icon if available, else fallback */}
                    {service.icon ? (
                      service.icon
                    ) : (
                      <Wrench className="h-8 w-8 mx-auto" />
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {service.features && (
                    <ul className="space-y-2">
                      {service.features.map(
                        (feature: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span>{feature}</span>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                  <Button className="w-full mt-4 btn-outline">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple and straightforward repair process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Bring Your Device",
                description:
                  "Visit our store with your damaged device or contact us for pickup service.",
                icon: <Smartphone className="h-8 w-8" />,
              },
              {
                step: "2",
                title: "Free Diagnosis",
                description:
                  "Our experts will examine your device and provide a detailed assessment.",
                icon: <Monitor className="h-8 w-8" />,
              },
              {
                step: "3",
                title: "Quality Repair",
                description:
                  "Professional repair using genuine parts with quality guarantee.",
                icon: <Wrench className="h-8 w-8" />,
              },
              {
                step: "4",
                title: "Testing & Delivery",
                description:
                  "Thorough testing and safe return of your fully functional device.",
                icon: <Shield className="h-8 w-8" />,
              },
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground">
                  {process.icon}
                </div>
                <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {process.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{process.title}</h3>
                <p className="text-muted-foreground">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Mule Mobile?
            </h2>
            <p className="text-xl text-muted-foreground">
              Trusted by thousands of customers in Addis Ababa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center card-elevated p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Technicians</h3>
              <p className="text-muted-foreground">
                Highly trained professionals with years of experience in mobile
                and electronics repair.
              </p>
            </div>

            <div className="text-center card-elevated p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Guarantee</h3>
              <p className="text-muted-foreground">
                All repairs come with warranty and we use only genuine or
                high-quality replacement parts.
              </p>
            </div>

            <div className="text-center card-elevated p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Turnaround</h3>
              <p className="text-muted-foreground">
                Most repairs completed within 24-48 hours. Emergency repairs
                available for urgent cases.
              </p>
            </div>
          </div>

          {/* Common Repairs */}
          <div className="bg-gradient-card rounded-xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8">
              Common Repairs We Handle
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                "Screen Replacement",
                "Battery Replacement",
                "Charging Port Repair",
                "Camera Repair",
                "Speaker/Microphone",
                "Water Damage",
                "Software Issues",
                "Motherboard Repair",
              ].map((repair, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="font-medium">{repair}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Fix Your Device?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Don't let a broken device slow you down. Visit us today for
            professional repair services.
          </p>
          <div className="flex flex-col text-primary sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button className="btn-hero">
                Visit Our Store
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="btn-outline border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <a href="tel:+251924700259">
                <Phone className="mr-2 h-5 w-5" />
                Call for Quote
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
