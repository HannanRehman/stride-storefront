import { allowedImage, AdminError } from "./admin-products";
export const defaultContent = {
  heroKicker: "New season. New possibilities.",
  heroLine1: "FIND YOUR",
  heroLine2: "NEXT GEAR.",
  heroDescription: "Hoodies, sets and everyday essentials. Find your own pace.",
  heroImage: "/images/hero-hoodie.webp",
  heroAlt:
    "Young man wearing a black oversized hoodie against a charcoal concrete wall",
  heroLabel: "Explore clothing",
  heroHref: "/shop/clothing",
  heroNote: "Everyday essentials",
  announcement: "Explore everyday clothing",
  announcementHref: "/shop/clothing",
  introTitle: "MADE TO GO YOUR OWN WAY.",
  introText: "Considered essentials. Everyday performance. A little more you.",
  supportEmail: "",
  supportPhone: "",
  supportHours: "",
  businessAddress: "",
  shippingInfo: "",
  returnsInfo: "",
  termsInfo: "",
  privacyInfo: "",
  launchEnabled: false,
};
export type SiteContent = typeof defaultContent;
export type ContentRecord = {
  draft: Partial<SiteContent>;
  published: Partial<SiteContent>;
  version: number;
  published_at: string | null;
};
export const contentLimits: Record<
  Exclude<keyof SiteContent, "launchEnabled">,
  number
> = {
  heroKicker: 100,
  heroLine1: 50,
  heroLine2: 50,
  heroDescription: 240,
  heroImage: 800,
  heroAlt: 200,
  heroLabel: 50,
  heroHref: 180,
  heroNote: 100,
  announcement: 180,
  announcementHref: 180,
  introTitle: 120,
  introText: 240,
  supportEmail: 254,
  supportPhone: 30,
  supportHours: 180,
  businessAddress: 400,
  shippingInfo: 4000,
  returnsInfo: 4000,
  termsInfo: 4000,
  privacyInfo: 4000,
};
export function contentHref(value: string) {
  return (
    /^\/(?:shop\/(?:all|shoes|clothing|accessories)|collections\/(?:pace|court|motion|everyday)|men|women|kids|new|help|contact|launch)(?:[?#][a-zA-Z0-9=&#_%+.-]*)?$/.test(
      value,
    ) && !/%(?:0[ad]|5c|2f)/i.test(value)
  );
}
export function contentInput(input: unknown, projectUrl: string): SiteContent {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new AdminError("Enter valid site content.");
  const values = input as Record<string, unknown>;
  const result = { ...defaultContent };
  for (const [key, max] of Object.entries(contentLimits)) {
    const value = values[key];
    if (
      typeof value !== "string" ||
      value.trim().length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    )
      throw new AdminError(`Check ${key}; maximum ${max} characters.`);
    if (
      !value.trim() &&
      ![
        "supportEmail",
        "supportPhone",
        "supportHours",
        "businessAddress",
        "shippingInfo",
        "returnsInfo",
        "termsInfo",
        "privacyInfo",
        "heroNote",
      ].includes(key)
    )
      throw new AdminError(`${key} cannot be blank.`);
    Object.assign(result, { [key]: value.trim() });
  }
  if (!contentHref(result.heroHref) || !contentHref(result.announcementHref))
    throw new AdminError("Choose an existing store page for campaign links.");
  result.heroImage = allowedImage(result.heroImage, projectUrl);
  if (
    result.supportEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.supportEmail)
  )
    throw new AdminError("Enter a valid support email or leave it blank.");
  if (result.supportPhone && !/^\+?\d[\d ()-]{6,29}$/.test(result.supportPhone))
    throw new AdminError("Enter a valid support phone or leave it blank.");
  if (typeof values.launchEnabled !== "boolean")
    throw new AdminError("Choose launch signup availability.");
  result.launchEnabled = values.launchEnabled;
  return result;
}
