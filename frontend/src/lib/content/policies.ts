export interface PolicySection {
  heading: string;
  body: string;
}

export interface Policy {
  title: string;
  updated: string;
  sections: PolicySection[];
}

export const policies: Record<string, Policy> = {
  "shipping-returns": {
    title: "Shipping & Returns",
    updated: "January 2026",
    sections: [
      {
        heading: "Shipping",
        body: "We ship nationwide across Pakistan. Orders are typically processed within 1-2 business days and delivered within 3-5 business days depending on your city. You'll receive tracking information by email once your order ships.",
      },
      {
        heading: "Returns",
        body: "Unworn items in their original packaging can be returned within 7 days of delivery for a full refund or exchange. Earrings cannot be returned for hygiene reasons unless defective. To start a return, contact our support team with your order number.",
      },
      {
        heading: "Damaged or Incorrect Items",
        body: "If your order arrives damaged or incorrect, contact us within 48 hours of delivery with photos and we'll arrange a replacement at no extra cost.",
      },
    ],
  },
  "care-guide": {
    title: "Care Guide",
    updated: "January 2026",
    sections: [
      {
        heading: "Everyday Care",
        body: "Put your jewellery on last, after perfume, lotion, and hairspray. Remove pieces before swimming, showering, or exercising to avoid tarnishing.",
      },
      {
        heading: "Storage",
        body: "Store each piece separately in a soft pouch or lined box to prevent scratching. Keep away from direct sunlight and humidity.",
      },
      {
        heading: "Cleaning",
        body: "Wipe gently with a soft, dry cloth after wear. For gold and silver-plated pieces, avoid harsh chemicals, chlorine, and abrasive cleaners.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "January 2026",
    sections: [
      {
        heading: "Information We Collect",
        body: "We collect the information you provide at checkout, including name, email, phone, and shipping address, solely to process and deliver your order.",
      },
      {
        heading: "How We Use It",
        body: "Your information is used to fulfill orders, respond to inquiries, and, if you opt in, send occasional updates about new collections. We do not sell your data to third parties.",
      },
      {
        heading: "Contact",
        body: "For questions about your data, reach out via our Contact page.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "January 2026",
    sections: [
      {
        heading: "Orders",
        body: "By placing an order, you confirm the details provided are accurate. We reserve the right to cancel orders in cases of pricing errors or stock unavailability.",
      },
      {
        heading: "Pricing",
        body: "All prices are listed in PKR and are subject to change without notice. Prices at the time of order confirmation apply.",
      },
      {
        heading: "Product Accuracy",
        body: "We aim to represent every product accurately; slight variations in color or finish may occur due to photography and screen settings.",
      },
    ],
  },
};
