import { ownerClient } from "@/lib/admin-server";
import { defaultContent } from "@/lib/site-content";
import { CampaignHero, CampaignIntro } from "@/components/campaign-hero";
export default async function Page() {
  const { client } = await ownerClient();
  const { data, error } = await client
    .from("site_content")
    .select("draft")
    .eq("id", "home")
    .single();
  if (error)
    return (
      <main id="main" className="admin-main">
        <h1>Preview unavailable</h1>
        <p>Save and activate the content editor first.</p>
      </main>
    );
  const content = { ...defaultContent, ...data.draft };
  return (
    <main id="main">
      <p className="content-preview-note">
        Private preview of the saved draft. The public homepage has not changed.
      </p>
      <div className="announcement">{content.announcement}</div>
      <CampaignHero content={content} />
      <CampaignIntro content={content} />
    </main>
  );
}
