import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import TestimonialLines, { type Testimonial } from "./TestimonialLines";

const testimonialsQuery = groq`
  *[_type == "testimonial"] | order(order asc) {
    _id,
    quote,
    name,
    company,
    image
  }
`;

export default async function TestimonialSection() {
  const testimonials: Testimonial[] = await client.fetch(testimonialsQuery, {}, { next: { revalidate: 60 } });

  if (!testimonials.length) return null;

  return (
    <section className="px-4 md:px-8 py-20 md:py-32 max-w-7xl mx-auto">
      <TestimonialLines testimonials={testimonials} />
    </section>
  );
}
