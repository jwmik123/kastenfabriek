import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import TestimonialSlider, { type Testimonial } from "./TestimonialSlider";

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
    <section className="w-full overflow-hidden bg-primary/20 py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <p className="m-0 mb-12 text-xl leading-tight text-primary md:mb-20">
          Wat onze klanten zeggen:
        </p>
      </div>

      {/* Cards bleed to the right edge, aligned to the page gutter on the left */}
      <div className="max-w-7xl mx-auto pl-4 md:pl-8">
        <TestimonialSlider testimonials={testimonials} />
      </div>
    </section>
  );
}
