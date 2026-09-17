import type { MessageKey } from "@/lib/i18n";

/**
 * One page per trade, because "vidéo réseaux sociaux restaurant" and "vidéo
 * immobilier réseaux sociaux" are different searches with real buying intent —
 * a single generic page ranks for neither.
 *
 * Slugs stay French in both languages: they are the words the primary market
 * searches, and one slug per page keeps the FR/EN pair on the same route.
 */
export type UseCase = {
  slug: string;
  metaTitle: MessageKey;
  metaDescription: MessageKey;
  h1: MessageKey;
  intro: MessageKey;
  /** Short list of concrete things this trade can publish. */
  ideas: readonly [MessageKey, MessageKey, MessageKey];
  /** The matching card on the landing page, reused for the cross-links. */
  cardTitle: MessageKey;
  cardBody: MessageKey;
  /** Card image, shared with the landing grid. */
  img: string;
};

export const USE_CASES: readonly UseCase[] = [
  {
    slug: "restaurant",
    metaTitle: "useCase.restaurant.metaTitle",
    metaDescription: "useCase.restaurant.metaDescription",
    h1: "useCase.restaurant.h1",
    intro: "useCase.restaurant.intro",
    ideas: ["useCase.restaurant.idea1", "useCase.restaurant.idea2", "useCase.restaurant.idea3"],
    cardTitle: "landing.useCase.restaurant.title",
    cardBody: "landing.useCase.restaurant.body",
    img: "/media/use-restaurant.jpg",
  },
  {
    slug: "immobilier",
    metaTitle: "useCase.immobilier.metaTitle",
    metaDescription: "useCase.immobilier.metaDescription",
    h1: "useCase.immobilier.h1",
    intro: "useCase.immobilier.intro",
    ideas: ["useCase.immobilier.idea1", "useCase.immobilier.idea2", "useCase.immobilier.idea3"],
    cardTitle: "landing.useCase.immo.title",
    cardBody: "landing.useCase.immo.body",
    img: "/media/use-immo.jpg",
  },
  {
    slug: "coach-sportif",
    metaTitle: "useCase.coach.metaTitle",
    metaDescription: "useCase.coach.metaDescription",
    h1: "useCase.coach.h1",
    intro: "useCase.coach.intro",
    ideas: ["useCase.coach.idea1", "useCase.coach.idea2", "useCase.coach.idea3"],
    cardTitle: "landing.useCase.coach.title",
    cardBody: "landing.useCase.coach.body",
    img: "/media/use-coach.jpg",
  },
  {
    slug: "e-commerce",
    metaTitle: "useCase.ecommerce.metaTitle",
    metaDescription: "useCase.ecommerce.metaDescription",
    h1: "useCase.ecommerce.h1",
    intro: "useCase.ecommerce.intro",
    ideas: ["useCase.ecommerce.idea1", "useCase.ecommerce.idea2", "useCase.ecommerce.idea3"],
    cardTitle: "landing.useCase.ecom.title",
    cardBody: "landing.useCase.ecom.body",
    img: "/media/use-ecom.jpg",
  },
];

export function findUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}

/** Every use-case route, for the sitemap and for `generateStaticParams`. */
export const listUseCasePaths = (): string[] => USE_CASES.map((u) => `/cas-usage/${u.slug}`);
