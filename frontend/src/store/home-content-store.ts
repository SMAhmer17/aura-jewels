import { create } from "zustand";
import type { HomeContent } from "@/types/home-content";
import { defaultHomeContent } from "@/lib/mock-data/home";

/** Fills any field or section missing from saved content with the defaults, so older saves keep working. */
export function withHomeDefaults(saved: Partial<HomeContent> | null | undefined): HomeContent {
  const base = defaultHomeContent;
  const s = saved ?? {};
  const savedSections = s.sections ?? [];
  const sections = [
    ...savedSections.filter((x) => base.sections.some((b) => b.id === x.id)),
    ...base.sections.filter((b) => !savedSections.some((x) => x.id === b.id)),
  ];
  return {
    ...base,
    ...s,
    hero: { ...base.hero, ...s.hero },
    sold: { ...base.sold, ...s.sold },
    why: { ...base.why, ...s.why },
    testimonials: { ...base.testimonials, ...s.testimonials },
    social: { ...base.social, ...s.social },
    sections,
  };
}

interface HomeContentState {
  content: HomeContent;
  setContent: (content: HomeContent) => void;
}

export const useHomeContentStore = create<HomeContentState>()((set) => ({
  content: defaultHomeContent,
  setContent: (content) => set({ content: withHomeDefaults(content) }),
}));
