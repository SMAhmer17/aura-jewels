import type { Review } from "@/types/review";

function review(id: string, productId: string, author: string, rating: number, comment: string, createdAt: string): Review {
  return { id, productId, author, rating, comment, createdAt };
}

export const seedReviews: Review[] = [
  review("rev-1", "prod-aurora-solitaire", "Ayesha K.", 5, "Beautiful ring, catches the light perfectly and it is comfortable enough to wear all day.", "2026-03-02T00:00:00.000Z"),
  review("rev-2", "prod-aurora-solitaire", "Maryam S.", 4, "Looks exactly like the photos. Packaging was lovely too.", "2026-03-10T00:00:00.000Z"),
  review("rev-3", "prod-ivory-pearl-necklace", "Hira A.", 5, "The pearls have a gorgeous glow. I have worn it to two weddings already.", "2026-03-05T00:00:00.000Z"),
  review("rev-4", "prod-halo-studs", "Sana R.", 5, "Light, sparkly, and they do not bother my ears. Perfect everyday studs.", "2026-03-08T00:00:00.000Z"),
  review("rev-5", "prod-halo-studs", "Noor F.", 4, "Very pretty. I wish there was a slightly larger size.", "2026-03-15T00:00:00.000Z"),
  review("rev-6", "prod-tennis-bracelet", "Zainab M.", 5, "Elegant and secure clasp. Got so many compliments.", "2026-03-12T00:00:00.000Z"),
  review("rev-7", "prod-bridal-set-serena", "Fatima H.", 5, "Wore this for my nikah and it photographed beautifully.", "2026-03-18T00:00:00.000Z"),
  review("rev-8", "prod-linked-bangle", "Iqra T.", 4, "Sturdy and stylish. Sized true to the chart.", "2026-03-20T00:00:00.000Z"),
  review("rev-9", "prod-velvet-ring-box", "Amna B.", 5, "Bought it as a gift box and the finish feels really premium.", "2026-03-22T00:00:00.000Z"),
];
