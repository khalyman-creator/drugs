import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getSiteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions, complaints, or feedback? Send us a message and we'll get back to you.",
  alternates: { canonical: `${getSiteUrl()}/contact` },
};

export default function ContactPage() {
  return <ContactForm />;
}
