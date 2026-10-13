# Public storefront design

The current scope is the public storefront: home, catalog, product detail, search, guest favorites and bag, and information pages. Accounts and checkout remain later milestones. Supabase replaces the provisional backend choice from the original implementation plan; this iteration prepares its catalog schema and optional read connection, without needing credentials to preview.

## Direction

Use the original Stride wordmark. Color tokens: page #FFFFFF, ink #111111, secondary #707072, subtle #F5F5F5, divider #E5E5E5, sale #B23A20. Neutral studio products and muted coastal/urban campaign photography provide color. Body uses a clear system sans; large display headlines use a licensed condensed font.

The hero is the visual statement: a wide running photograph with readable large type, followed by quiet editorial panels and borderless product rails. Product information is left aligned; campaign copy can be centered. Controls use black/white pills. No decorative gradients, card shadows, or unnecessary panel outlines.

```text
Utility strip
Wordmark / audience navigation / search / saved / bag
Announcement
Wide original running campaign with headline and shop action
Campaign copy and secondary audience action
Three editorial panels
Trending product rail
Shop by category
Classic collection rail
Shop by sport
Brand story
Category links and footer
```

The design was reviewed against the brief before implementation: a full-bleed athletic photograph and strong display headline carry the homepage; product discovery keeps the requested neutral three-column catalog and structured facets. The Stride coastal campaign, original geometric product styling, and original copy establish identity. Nike assets, advertising copy, font files, logos, and source code are not used.

Lenis provides gentle mouse-wheel and anchor scrolling only for people who have not requested reduced motion. Touch remains native. Dialogs pause background smoothing and retain native internal scrolling. Horizontal rails respect the same motion preference. Mobile has an accessible navigation drawer and filter sheet; neither requires hover.
