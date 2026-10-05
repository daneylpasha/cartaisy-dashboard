/**
 * Public commercial facts for Cartaisy C01.
 * Pages, FAQ, SEO, and docs should read this module instead of hardcoding a second offer.
 * Do not add prices, trial terms, ratings, download counts, or sales guarantees here.
 */

export const offerPaths = {
  home: '/',
  fit: '/fit',
  pricing: '/pricing',
  demo: '/demo',
  productTour: '/product-tour',
  walkthrough: '/schedule-demo',
  contact: '/contact',
  features: '/features',
  login: '/login',
  signup: '/signup',
  docs: '/docs',
  docsFaq: '/docs/faq',
  docsShopify: '/docs/shopify',
  terms: '/terms',
  privacy: '/privacy',
  leads: '/dashboard/admin/leads',
} as const;

export const offerPositioning = {
  eyebrow: 'Managed mobile apps for Shopify',
  headline: 'Give your Shopify customers a branded mobile shopping experience.',
  subhead:
    'Cartaisy is a managed shopping app for one Shopify store. Shoppers browse and use a cart in the app, then pay on Shopify hosted checkout. An operator invites you in. There is no self-serve signup, no free trial, and no promise of more sales.',
  primaryCta: 'Check if Cartaisy fits your store',
  secondaryCta: 'See Cartaisy in action',
  walkthroughCta: 'Request a walkthrough',
  pricingCta: 'See the managed offer',
} as const;

export const offerSeo = {
  title: 'Managed mobile apps for Shopify',
  description:
    'Cartaisy sets up a branded shopping app for a Shopify store. Shoppers check out on Shopify. Invite-only, one managed offer, no public price and no sales guarantee.',
  keywords: [
    'Shopify mobile app',
    'managed Shopify app',
    'branded shopping app',
    'Shopify hosted checkout',
    'invite-only Shopify app',
  ],
} as const;

export const managedOffer = {
  name: 'One managed offer',
  structure:
    'Setup, then a recurring fee. Both are agreed with you before work starts. Cartaisy does not publish a dollar amount on this site, and the product does not charge a card.',
  notIncludedInTheProduct:
    'There is no free trial, no automatic checkout, and no menu of Starter, Growth, Pro, or Enterprise plans.',
} as const;

export const offerIncludes = [
  {
    title: 'Invite-only dashboard',
    body: 'After a fit check and a walkthrough, an operator can send a signup link. Open signup is not available.',
  },
  {
    title: 'Shopify connection for an allowed store',
    body: 'The invited merchant connects a Shopify store from the dashboard. Today that connection is reliable for stores the Shopify app is allowed to install on. A public App Store install is not a way for a new merchant to create an account.',
  },
  {
    title: 'Catalog sync',
    body: 'Product sync, including variant and inventory fields, is implemented. It was proven on Cartaisy’s own staging store. A new shop still needs its own sync to succeed before a build.',
  },
  {
    title: 'Brand you can set',
    body: 'Name, logo, primary and secondary colors, app icon, and splash image. Colors and logo can update in the shopper app without a new binary. The launcher name, native icon, and native splash need a new build.',
  },
  {
    title: 'Home layout',
    body: 'You can publish a home made of the supported modules, or leave it unpublished. An unpublished home uses the app’s smart default.',
  },
  {
    title: 'Shopify hosted checkout',
    body: 'Shoppers browse, use a cart, and continue to Shopify’s hosted checkout. Cartaisy does not take the payment.',
  },
  {
    title: 'A tracked build request',
    body: 'Build my app records Android and iOS status. A sample Android build was installed on a device in August 2026. An iOS production binary is not ready.',
  },
] as const;

export const offerExcludes = [
  'Self-serve signup, a free trial, card or PayPal checkout, and published price tiers',
  'A Shopify App Store install that creates a Cartaisy account by itself',
  'Push campaigns, abandoned-cart messaging, and loyalty programs',
  'Apple Pay or Google Pay as a Cartaisy checkout. Any wallet button is Shopify’s, for that store',
  'A guarantee of sales, downloads, ratings, or app-store approval',
  'Custom screens, one-off integrations, or a promise that every Shopify app works',
  'A public sample app, TestFlight link, or Play install from this website',
  'Multi-currency Markets, Shopify Plus, or subscriptions as a supported offer',
  'Changing the launcher icon or native splash without a new build',
] as const;

export const eligibility = {
  operating:
    'You already sell on Shopify and want shoppers to use a branded app that stays on your catalog and Shopify checkout.',
  prelaunch:
    'You are planning a Shopify store. You can talk with Cartaisy before the store exists. The store still has to come first. A store URL is optional on the fit check.',
  websiteFirst:
    'If you do not plan to use Shopify, or you want an app to create customers you do not have, start with the website. Cartaisy does not acquire customers for you and does not guarantee sales.',
} as const;

export const ownership = {
  accounts:
    'You own the Apple Developer account and the Google Play account, and you own the store listings under those accounts. Apple and Google charge their own program fees. Those fees are not Cartaisy prices, and this site does not quote them.',
  expo: 'Builds run on a Cartaisy-managed Expo project unless a later agreement says otherwise.',
  firebase:
    'A per-store Firebase project is a later dependency for push. Push is not part of this offer.',
  exit: 'This site does not publish a cancellation, refund, or offboarding policy. Those terms are part of the agreement you make with Cartaisy before work starts, and they are not decided in the product.',
} as const;

export const checkoutWording =
  'Shoppers pay on Shopify hosted checkout. Cartaisy does not collect card numbers. Apple Pay and Google Pay are not Cartaisy features. If a wallet appears, it is Shopify’s checkout for that store.';

export const iosReadiness =
  'iOS is not a production offer. No merchant iOS binary is ready. Android has a sample branded build from August 2026, which is not a public install link.';

export const shopifyScopesDisclosure =
  'Shopify scopes are whatever the Partner app requests at install, from the SHOPIFY_SCOPES setting on the Cartaisy backend. This site does not publish that list. Confirm the live value in the Railway project before treating any scope list as current. Older docs that named five scopes were incomplete.';

export const appStoreAcquisitionTodo =
  'Public Shopify App Store install, then claim, then invite, is not a working path for a new merchant. Signup stays invite-only, and claim requires a signed-in store admin. Do not link an App Store listing as the way to buy Cartaisy.';

export const supportEmail = 'support@cartaisy.com';

export const publicFaqs: { question: string; answer: string }[] = [
  {
    question: 'Who is Cartaisy for?',
    answer: `${eligibility.operating} ${eligibility.prelaunch}`,
  },
  {
    question: 'When should I stay on the website?',
    answer: eligibility.websiteFirst,
  },
  {
    question: 'What does the offer include?',
    answer: offerIncludes.map((item) => `${item.title}: ${item.body}`).join(' '),
  },
  {
    question: 'What is not included?',
    answer: offerExcludes.join('. ') + '.',
  },
  {
    question: 'How much does it cost?',
    answer: `${managedOffer.structure} ${managedOffer.notIncludedInTheProduct}`,
  },
  {
    question: 'Can I try it myself?',
    answer:
      'There is no free trial and no public sample install. You can check fit without an account, read the product tour, and request a walkthrough. A person follows up. The form does not book a calendar slot by itself.',
  },
  {
    question: 'How do I get an account?',
    answer:
      'Accounts are invite-only. Check fit or request a walkthrough. If Cartaisy proceeds, an operator sends a signup link. The login page is for people who already have an account.',
  },
  {
    question: 'Where do shoppers pay?',
    answer: checkoutWording,
  },
  {
    question: 'Who owns the app store accounts?',
    answer: `${ownership.accounts} ${ownership.expo} ${ownership.exit}`,
  },
  {
    question: 'Is the iOS app ready?',
    answer: iosReadiness,
  },
  {
    question: 'Can I install Cartaisy from the Shopify App Store?',
    answer: appStoreAcquisitionTodo,
  },
  {
    question: 'Which Shopify permissions does Cartaisy ask for?',
    answer: shopifyScopesDisclosure,
  },
  {
    question: 'What happens if I stop?',
    answer: ownership.exit,
  },
  {
    question: 'Does Cartaisy guarantee sales?',
    answer:
      'No. The app can make repeat shopping more convenient for people who already buy from your Shopify store. It does not create an audience and it does not promise revenue, ratings, or downloads.',
  },
];
