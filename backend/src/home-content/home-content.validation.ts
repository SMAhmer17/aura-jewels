import { BadRequestException } from '@nestjs/common';

const SECTION_IDS = ['categories', 'bestsellers', 'sold', 'why', 'testimonials', 'social', 'trust'];
// Links must be web links or site paths. This blocks javascript: URLs that would run when clicked.
const SAFE_LINK = /^(https?:\/\/[^\s"'<>]+|\/[^\s"'<>]*)$/;

// A tile's picture or video must be a web link or a file this API uploaded.
const MEDIA_URL = /^(https?:\/\/[^\s"'<>]{1,500}|\/uploads\/[A-Za-z0-9._-]{1,200})$/;

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function link(value: unknown, where: string) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string' || !SAFE_LINK.test(value)) {
    throw new BadRequestException(`${where} must be a web link (https://...) or a site path (/shop).`);
  }
}

/** The home page is stored as JSON. Check its shape and that every link is safe before saving. */
export function validateHomeContent(content: unknown): asserts content is Json {
  if (!isObject(content)) throw new BadRequestException('Home content must be an object.');
  if (JSON.stringify(content).length > 200_000) throw new BadRequestException('Home content is too large.');

  const { hero, sections, social, testimonials, why, trustPoints } = content;
  if (!isObject(hero)) throw new BadRequestException('Home content needs a hero section.');
  for (const key of ['eyebrow', 'heading', 'body', 'ctaLabel', 'ctaHref']) {
    if (typeof hero[key] !== 'string') throw new BadRequestException(`hero.${key} must be text.`);
  }
  link(hero.ctaHref, 'The hero button link');

  if (!Array.isArray(sections)) throw new BadRequestException('Home content needs a sections list.');
  const seen = new Set<string>();
  for (const s of sections) {
    if (!isObject(s) || typeof s.id !== 'string' || !SECTION_IDS.includes(s.id) || typeof s.visible !== 'boolean') {
      throw new BadRequestException('Each section needs a known id and a visible flag.');
    }
    if (seen.has(s.id)) throw new BadRequestException(`Section "${s.id}" is listed twice.`);
    seen.add(s.id);
  }

  if (social !== undefined) {
    if (!isObject(social)) throw new BadRequestException('social must be an object.');
    link(social.instagramUrl, 'The Instagram link');
    link(social.tiktokUrl, 'The TikTok link');
    link(social.facebookUrl, 'The Facebook link');
    if (social.posts !== undefined) {
      if (!Array.isArray(social.posts) || social.posts.length > 24) throw new BadRequestException('social.posts must be a list of at most 24 posts.');
      for (const p of social.posts) {
        link(isObject(p) ? p.url : undefined, 'A social post link');
        if (!isObject(p) || p.mediaUrl === undefined || p.mediaUrl === null || p.mediaUrl === '') continue;
        if (typeof p.mediaUrl !== 'string' || !MEDIA_URL.test(p.mediaUrl)) {
          throw new BadRequestException('A post picture or video must be an https link or an uploaded file.');
        }
        if (p.mediaType !== 'image' && p.mediaType !== 'video') {
          throw new BadRequestException('A post with media must say whether it is an image or a video.');
        }
      }
    }
  }
  if (testimonials !== undefined && (!isObject(testimonials) || !Array.isArray(testimonials.items) || testimonials.items.length > 24)) {
    throw new BadRequestException('testimonials.items must be a list of at most 24 items.');
  }
  if (why !== undefined && (!isObject(why) || !Array.isArray(why.points) || why.points.length > 12)) {
    throw new BadRequestException('why.points must be a list of at most 12 points.');
  }
  if (trustPoints !== undefined && (!Array.isArray(trustPoints) || trustPoints.length > 12)) {
    throw new BadRequestException('trustPoints must be a list of at most 12 points.');
  }
}
