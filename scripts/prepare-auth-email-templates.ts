// Generates dashboard-ready Supabase templates, without changing Auth settings.
import { mkdir, writeFile } from "node:fs/promises";
import { emailLayout } from "../src/lib/email-template";

const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
if (!args.includes("--site"))
  throw new Error("Pass --site with the production HTTPS website origin.");
const site = new URL(option("--site"));
if (site.protocol !== "https:" || site.username || site.password)
  throw new Error("Use an HTTPS website URL without credentials.");
const brand = args.includes("--brand")
  ? option("--brand")
  : "Stride Storefront";
if (!brand?.trim() || brand.length > 100 || /[\u0000-\u001f]/.test(brand))
  throw new Error("Use a plain sender name of at most 100 characters.");
const folder = "docs/email-templates/supabase";
await mkdir(folder, { recursive: true });
for (const template of [
  {
    file: "confirm-signup.html",
    subject: `Confirm your ${brand} account`,
    heading: "One step to your account.",
    preheader: "Confirm your email to finish creating your account.",
    paragraphs: [
      "Confirm this email address to finish setting up your account. You can then save your bag and favorites and view your orders.",
      "If you did not create an account, you can ignore this email.",
    ],
    action: "Confirm email address",
  },
  {
    file: "reset-password.html",
    subject: `Reset your ${brand} password`,
    heading: "Choose a new password.",
    preheader: "Use this link if you asked to reset your password.",
    paragraphs: [
      "We received a request to reset the password for your account. Use the link below to choose a new one.",
      "If you did not request this, ignore this email. Your password will stay the same.",
    ],
    action: "Reset password",
  },
]) {
  const message = emailLayout({
    ...template,
    brand,
    url: "{{ .ConfirmationURL }}",
    contact: new URL("/contact", site.origin).href,
  });
  await writeFile(`${folder}/${template.file}`, message.html + "\n");
}
console.log(
  "Prepared two Supabase dashboard HTML templates. No service settings changed or emails sent.",
);
