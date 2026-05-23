import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description:
          "Thank you for contacting us. We'll get back to you within 24 hours.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      setIsSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Contact
            <span className="text-accent block">Mule Mobile</span>
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Get in touch with us for support, inquiries, or to visit our store
            in Addis Ababa.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We're here to help! Whether you need product information, repair
                services, or have any questions, don't hesitate to reach out to
                us.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-6">
              <div className="card-elevated p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Visit Our Store
                  </h3>
                  <p className="text-muted-foreground">
                    location
                    <br />
                    Addis Ababa, Ethiopia
                    <br />
                    {/* <span className="text-sm">Look for the bright yellow signage!</span> */}
                  </p>
                </div>
              </div>

              <div className="card-elevated p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Call Us</h3>
                  <p className="text-muted-foreground">
                    <a
                      href="tel:+251924700259"
                      className="hover:text-primary transition-colors"
                    >
                      +251-924-700259
                    </a>
                    <br />

                    <span className="text-sm">Available 7 days a week</span>
                  </p>
                </div>
              </div>

              <div className="card-elevated p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Email Us</h3>
                  <p className="text-muted-foreground">
                    <a
                      href="mailto:mulemobile555@gmail.com"
                      className="hover:text-primary transition-colors"
                    >
                      mulemobile555@gmail.com
                    </a>
                    <br />

                    <span className="text-sm">We respond within 24 hours</span>
                  </p>
                </div>
              </div>

              <div className="card-elevated p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Business Hours</h3>
                  <div className="text-muted-foreground space-y-1">
                    <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
                    <p>Saturday: 9:00 AM - 7:00 PM</p>
                    <p>Sunday: 10:00 AM - 6:00 PM</p>
                    <p className="text-sm text-accent">
                      Extended hours for repair services
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button className="btn-primary" asChild>
                <a href="tel:+251924700259">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </a>
              </Button>
              <Button variant="outline" className="btn-outline" asChild>
                <a
                  href="https://t.me/mulemobile5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Telegram
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Find Us</h2>
          <div className="card-elevated p-4">
            <div className="w-full h-96 rounded-lg overflow-hidden">
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

        {/* FAQ Section */}
        {/* <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: "Do you offer warranty on repairs?",
                answer:
                  "Yes, all our repairs come with a 3-6 month warranty depending on the type of repair.",
              },
              {
                question: "How long do repairs usually take?",
                answer:
                  "Most repairs are completed within 24-48 hours. Complex repairs may take 3-5 days.",
              },
              {
                question: "Do you buy used phones?",
                answer:
                  "Yes, we buy used phones in good condition. Bring your device for evaluation.",
              },
              {
                question: "Can I track my repair status?",
                answer:
                  "Yes, we provide a tracking number and regular updates on your repair progress.",
              },
            ].map((faq, index) => (
              <div key={index} className="card-elevated p-6">
                <h3 className="font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Contact;
