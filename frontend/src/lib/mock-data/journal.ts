export interface JournalArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  publishedAt: string;
}

export const journalArticles: JournalArticle[] = [
  {
    slug: "how-to-stack-rings",
    title: "The Art of Stacking Rings",
    excerpt: "A simple guide to mixing solitaires, bands, and stackables without overdoing it.",
    content: [
      "Stacking rings is about balance, not quantity. Start with one statement piece, a solitaire or a signet, and build around it with slimmer bands.",
      "Mix metals sparingly. Pairing gold and silver can look intentional, but it works best when one metal clearly leads.",
      "Leave room to breathe. A stack of two or three rings on one hand tends to read as more considered than five.",
    ],
    publishedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    slug: "choosing-your-first-fine-jewellery",
    title: "Choosing Your First Piece of Fine Jewellery",
    excerpt: "What to look for in materials, fit, and design when buying jewellery meant to last.",
    content: [
      "Start with pieces you'll reach for often, a pair of studs or a simple pendant, rather than something purely occasion-only.",
      "Pay attention to material: 18k gold plating and 925 sterling silver offer durability without the cost of solid gold.",
      "Fit matters as much as design. A ring that's slightly loose or an earring that's too heavy will end up sitting in a drawer.",
    ],
    publishedAt: "2026-02-10T00:00:00.000Z",
  },
  {
    slug: "caring-for-plated-jewellery",
    title: "How to Make Plated Jewellery Last Longer",
    excerpt: "Small daily habits that noticeably extend the life of gold and rhodium plated pieces.",
    content: [
      "Plating wears fastest from friction and chemical exposure, not from age alone.",
      "Put jewellery on last, after your skincare and perfume, and take it off before washing your hands or sleeping.",
      "Store pieces flat and separated, ideally in the pouch they arrived in, to avoid scratching the plating.",
    ],
    publishedAt: "2026-02-18T00:00:00.000Z",
  },
];
