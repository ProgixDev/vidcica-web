/**
 * Static help catalogue — FAQ, guides, tutorials. Ported verbatim from
 * ClipFlow/src/mocks/support.ts (there is no `faqs` table). Entries reference
 * i18n keys only; the copy lives in messages.ts so it stays bilingual and
 * searchable in the active locale.
 */
import type { MessageKey } from "@/lib/i18n";

export type FaqCategory = "start" | "generate" | "publish" | "ads" | "billing";

export type FaqEntry = {
  id: string;
  category: FaqCategory;
  questionKey: MessageKey;
  answerKey: MessageKey;
};

/** Category chips (order matters). `all` is handled separately in the UI. */
export const FAQ_CATEGORIES: ReadonlyArray<{ id: FaqCategory; labelKey: MessageKey }> = [
  { id: "start", labelKey: "help.faq.cat.start" },
  { id: "generate", labelKey: "help.faq.cat.generate" },
  { id: "publish", labelKey: "help.faq.cat.publish" },
  { id: "ads", labelKey: "help.faq.cat.ads" },
  { id: "billing", labelKey: "help.faq.cat.billing" },
];

export const FAQ_ENTRIES: ReadonlyArray<FaqEntry> = [
  // Démarrage
  { id: "faq_start_1", category: "start", questionKey: "help.faq.q1", answerKey: "help.faq.a1" },
  {
    id: "faq_start_2",
    category: "start",
    questionKey: "help.faq.start.q1",
    answerKey: "help.faq.start.a1",
  },
  {
    id: "faq_start_3",
    category: "start",
    questionKey: "help.faq.start.q2",
    answerKey: "help.faq.start.a2",
  },
  // Génération
  {
    id: "faq_gen_1",
    category: "generate",
    questionKey: "help.faq.gen.q1",
    answerKey: "help.faq.gen.a1",
  },
  {
    id: "faq_gen_2",
    category: "generate",
    questionKey: "help.faq.gen.q2",
    answerKey: "help.faq.gen.a2",
  },
  { id: "faq_gen_3", category: "generate", questionKey: "help.faq.q5", answerKey: "help.faq.a5" },
  // Publication
  { id: "faq_pub_1", category: "publish", questionKey: "help.faq.q4", answerKey: "help.faq.a4" },
  { id: "faq_pub_2", category: "publish", questionKey: "help.faq.q2", answerKey: "help.faq.a2" },
  { id: "faq_pub_3", category: "publish", questionKey: "help.faq.q6", answerKey: "help.faq.a6" },
  // Ads
  {
    id: "faq_ads_1",
    category: "ads",
    questionKey: "help.faq.ads.q1",
    answerKey: "help.faq.ads.a1",
  },
  {
    id: "faq_ads_2",
    category: "ads",
    questionKey: "help.faq.ads.q2",
    answerKey: "help.faq.ads.a2",
  },
  {
    id: "faq_ads_3",
    category: "ads",
    questionKey: "help.faq.ads.q3",
    answerKey: "help.faq.ads.a3",
  },
  // Facturation
  { id: "faq_bill_1", category: "billing", questionKey: "help.faq.q3", answerKey: "help.faq.a3" },
  {
    id: "faq_bill_2",
    category: "billing",
    questionKey: "help.faq.bill.q1",
    answerKey: "help.faq.bill.a1",
  },
  {
    id: "faq_bill_3",
    category: "billing",
    questionKey: "help.faq.bill.q2",
    answerKey: "help.faq.bill.a2",
  },
];

export type Guide = {
  id: string;
  titleKey: MessageKey;
  descKey: MessageKey;
};

export const GUIDES: ReadonlyArray<Guide> = [
  { id: "start", titleKey: "help.guide.start", descKey: "help.guide.start.desc" },
  { id: "networks", titleKey: "help.guide.networks", descKey: "help.guide.networks.desc" },
  { id: "ads", titleKey: "help.guide.ads", descKey: "help.guide.ads.desc" },
  { id: "brand", titleKey: "help.guide.brand", descKey: "help.guide.brand.desc" },
];

/** Colour seed per tutorial — maps to a token-driven gradient class in the UI. */
export type TutorialAccent = "brand" | "success" | "warning" | "neutral";

export type Tutorial = {
  id: string;
  durationSec: number;
  accent: TutorialAccent;
  titleKey: MessageKey;
  bodyKey: MessageKey;
};

export const TUTORIALS: ReadonlyArray<Tutorial> = [
  {
    id: "tut_first_video",
    durationSec: 192,
    accent: "brand",
    titleKey: "help.tutorials.first.title",
    bodyKey: "help.tutorials.first.body",
  },
  {
    id: "tut_connect_networks",
    durationSec: 168,
    accent: "success",
    titleKey: "help.tutorials.networks.title",
    bodyKey: "help.tutorials.networks.body",
  },
  {
    id: "tut_script_to_video",
    durationSec: 240,
    accent: "brand",
    titleKey: "help.tutorials.script.title",
    bodyKey: "help.tutorials.script.body",
  },
  {
    id: "tut_publish",
    durationSec: 156,
    accent: "neutral",
    titleKey: "help.tutorials.publish.title",
    bodyKey: "help.tutorials.publish.body",
  },
  {
    id: "tut_ads_setup",
    durationSec: 280,
    accent: "warning",
    titleKey: "help.tutorials.ads.title",
    bodyKey: "help.tutorials.ads.body",
  },
  {
    id: "tut_optimize_ads",
    durationSec: 220,
    accent: "warning",
    titleKey: "help.tutorials.optimize.title",
    bodyKey: "help.tutorials.optimize.body",
  },
  {
    id: "tut_lead_management",
    durationSec: 188,
    accent: "success",
    titleKey: "help.tutorials.leads.title",
    bodyKey: "help.tutorials.leads.body",
  },
  {
    id: "tut_analytics",
    durationSec: 204,
    accent: "neutral",
    titleKey: "help.tutorials.analytics.title",
    bodyKey: "help.tutorials.analytics.body",
  },
];
