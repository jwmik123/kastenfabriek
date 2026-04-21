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
    <section className="w-full bg-primary/20 py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <TestimonialLines testimonials={testimonials} />
      </div>
    </section>
  );
}
