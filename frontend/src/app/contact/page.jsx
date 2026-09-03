import ContactClient from "../../views/Contact.jsx";

export const metadata = {
  title: "Contact Us & Get a Quote | ARCL Instruments",
  description:
    "Get in touch with ARCL Instruments Pvt. Ltd. for instrument pricing, quotations, custom engineering requirements, technical support, and office visits in Airoli, Navi Mumbai.",
  keywords: [
    "contact ARCL Instruments",
    "laboratory equipment quote",
    "lab instruments inquiry Navi Mumbai",
  ],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactRoute() {
  return <ContactClient />;
}
