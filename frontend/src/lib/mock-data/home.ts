import type { HomeContent } from "@/types/home-content";

const INSTAGRAM_URL = "https://www.instagram.com/aurajewelsbyzas/";

export const defaultHomeContent: HomeContent = {
  hero: {
    eyebrow: "Aura Jewels · By ZAS",
    heading: "Jewellery made for the moments you remember",
    body: "Considered pieces in gold, silver, and stone, designed in Pakistan for everyday elegance and occasions worth marking.",
    ctaLabel: "Shop the Collection",
    ctaHref: "/shop",
  },
  sections: [
    { id: "categories", visible: true },
    { id: "bestsellers", visible: true },
    { id: "sold", visible: true },
    { id: "why", visible: true },
    { id: "testimonials", visible: true },
    { id: "social", visible: true },
    { id: "trust", visible: true },
  ],
  categoriesHeading: "Shop by Category",
  bestsellersHeading: "Bestsellers",
  sold: {
    eyebrow: "Already Sold",
    heading: "Pieces that found a home",
    description: "These designs have sold out. Follow along to see what we release next.",
  },
  why: {
    eyebrow: "Why Aura Jewels",
    heading: "What makes us different",
    points: [
      { id: "w1", title: "Considered Design", description: "Every piece is refined over several rounds before it earns a place in the collection." },
      { id: "w2", title: "Hand Checked Quality", description: "Each order is inspected by hand before it leaves our studio." },
      { id: "w3", title: "Made for Every Day", description: "Light, comfortable pieces designed to be worn often, not saved for a drawer." },
      { id: "w4", title: "Gift Ready", description: "Choose a jewellery box at checkout and your order arrives ready to give." },
    ],
  },
  testimonials: {
    eyebrow: "Customer Love",
    heading: "What our customers say",
    items: [
      { id: "t1", name: "Ayesha K.", city: "Karachi", rating: 5, quote: "The solitaire ring looks even better in person. It arrived beautifully packed and I have not taken it off since." },
      { id: "t2", name: "Hira A.", city: "Lahore", rating: 5, quote: "I ordered the pearl necklace for a wedding and got compliments all night. The quality feels far above the price." },
      { id: "t3", name: "Sana R.", city: "Islamabad", rating: 5, quote: "Fast delivery, easy sizing, and the earrings are light enough to wear all day. Already planning my next order." },
    ],
  },
  social: {
    eyebrow: "Follow Along",
    handle: "@aurajewelsbyzas",
    description: "New pieces, styling ideas, and behind the scenes from our studio.",
    instagramUrl: INSTAGRAM_URL,
    tiktokUrl: "https://www.tiktok.com/@aurajewelsbyzas",
    facebookUrl: "https://www.facebook.com/aurajewelsbyzas/",
    posts: [
      { id: "p1", caption: "New arrivals on the bench", url: INSTAGRAM_URL },
      { id: "p2", caption: "Styling the Aurora solitaire", url: INSTAGRAM_URL },
      { id: "p3", caption: "Packing orders with care", url: INSTAGRAM_URL },
      { id: "p4", caption: "Bridal set close up", url: INSTAGRAM_URL },
      { id: "p5", caption: "Customer favourite: pearl drops", url: INSTAGRAM_URL },
      { id: "p6", caption: "Behind the scenes at the studio", url: INSTAGRAM_URL },
    ],
  },
  trustPoints: [
    { id: "tr1", label: "Quality checked before shipping" },
    { id: "tr2", label: "Nationwide delivery across Pakistan" },
    { id: "tr3", label: "7-day easy returns" },
  ],
};
