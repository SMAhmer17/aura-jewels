export type HomeSectionId = "categories" | "bestsellers" | "sold" | "why" | "testimonials" | "social" | "trust";

export interface HomeSectionConfig {
  id: HomeSectionId;
  visible: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
}

export interface TitledPoint {
  id: string;
  title: string;
  description: string;
}

export interface SocialPost {
  id: string;
  caption: string;
  url: string;
}

export interface TrustPoint {
  id: string;
  label: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    heading: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  /** Order of this array is the order sections render below the hero. */
  sections: HomeSectionConfig[];
  categoriesHeading: string;
  bestsellersHeading: string;
  sold: { eyebrow: string; heading: string; description: string };
  why: { eyebrow: string; heading: string; points: TitledPoint[] };
  testimonials: { eyebrow: string; heading: string; items: Testimonial[] };
  social: {
    eyebrow: string;
    handle: string;
    description: string;
    instagramUrl: string;
    tiktokUrl: string;
    facebookUrl: string;
    posts: SocialPost[];
  };
  trustPoints: TrustPoint[];
}

export const HOME_SECTION_LABELS: Record<HomeSectionId, string> = {
  categories: "Shop by Category",
  bestsellers: "Bestsellers",
  sold: "Sold Out Showcase",
  why: "Why Aura Jewels",
  testimonials: "Customer Feedback",
  social: "Social Feed",
  trust: "Trust Strip",
};
