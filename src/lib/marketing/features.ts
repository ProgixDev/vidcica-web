import type { MessageKey } from "@/lib/i18n";

/**
 * The product feature cards, in display order. Shared by the landing section and
 * the dedicated `/fonctionnalites` page so both always describe the same product.
 */
export const FEATURES: {
  title: MessageKey;
  body: MessageKey;
  icon: { path?: string; circles?: [number, number, number][] };
}[] = [
  {
    title: "landing.feature.script.title",
    body: "landing.feature.script.body",
    icon: { path: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
  },
  {
    title: "landing.feature.voice.title",
    body: "landing.feature.voice.body",
    icon: {
      path: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v1a7 7 0 0 1-14 0v-1M12 18v4",
    },
  },
  {
    title: "landing.feature.subtitles.title",
    body: "landing.feature.subtitles.body",
    icon: {
      path: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM7 15h4m2 0h4M7 11h2m2 0h6",
    },
  },
  {
    title: "landing.feature.music.title",
    body: "landing.feature.music.body",
    icon: {
      path: "M9 18V5l12-2v13",
      circles: [
        [6, 18, 3],
        [18, 16, 3],
      ],
    },
  },
  {
    title: "landing.feature.publish.title",
    body: "landing.feature.publish.body",
    icon: {
      path: "m8.6 13.4 6.8 3.9M15.4 6.7l-6.8 3.9",
      circles: [
        [18, 5, 3],
        [6, 12, 3],
        [18, 19, 3],
      ],
    },
  },
  {
    title: "landing.feature.campaigns.title",
    body: "landing.feature.campaigns.body",
    icon: {
      circles: [
        [12, 12, 9],
        [12, 12, 5],
        [12, 12, 1],
      ],
    },
  },
];
