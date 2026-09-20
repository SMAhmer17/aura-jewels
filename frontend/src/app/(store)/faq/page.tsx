import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";

const faqs = [
  {
    question: "How do I find my ring size?",
    answer:
      "Measure the inside diameter of a ring that fits you well and compare it to a standard sizing chart, or visit a local jeweller for an accurate measurement. If you're between sizes, we recommend sizing up.",
  },
  {
    question: "What materials do you use?",
    answer:
      "Our pieces are made from 18k gold plating, 925 sterling silver, and rhodium plating, paired with cubic zirconia, freshwater pearls, and other quality stones. Each product page lists its exact materials.",
  },
  {
    question: "Do you offer returns or exchanges?",
    answer:
      "Yes, unworn items in original condition can be returned within 7 days of delivery. See our Shipping & Returns policy for full details.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders are typically delivered within 3-5 business days across Pakistan. You'll receive tracking details once your order ships.",
  },
  {
    question: "How should I care for my jewellery?",
    answer:
      "Avoid contact with water, perfume, and lotion. Store pieces separately in a soft pouch to prevent scratching. See our Care Guide for material-specific tips.",
  },
  {
    question: "Do you ship outside Pakistan?",
    answer: "Not yet. We currently ship nationwide within Pakistan only.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-gold">FAQ</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Frequently Asked Questions</h1>
      </div>

      <Reveal>
        <Accordion items={faqs} />
      </Reveal>
    </div>
  );
}
