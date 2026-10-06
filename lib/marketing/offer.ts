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
  headline: 'Your Shopify store, made mobile.',
  subhead:
    'A branded shopping app for your Shopify store, with guided setup from Cartaisy. Customers browse in the app and pay through Shopify checkout.',
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
    body: 'After a fit check and a walkthrough, Cartaisy can send a signup link. Open signup is not available.',
  },
  {
    title: 'Shopify connection from your dashboard',
    body: 'You connect your Shopify store from the dashboard after you have an account. The connection works when the Cartaisy Shopify app can be installed on that store. Installing from the Shopify App Store does not create an account.',
  },
  {
    title: 'Catalog sync',
    body: 'Products can sync, including variants and inventory. Your store still needs its own successful sync before a build.',
  },
  {
    title: 'Brand you can set',
    body: 'Name, logo, primary and secondary colors, app icon, and splash image. Colors and the logo can update in the shopper app without a new build. The home-screen name, icon, and splash need a new build.',
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
    body: 'Build my app records Android and iOS status. Android is not yet generally available. iOS is not ready for a merchant app.',
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
  'iOS is not ready for a merchant app. Saving an iOS request is not a live iPhone app.';

export const shopifyScopesDisclosure =
  'The exact Shopify access permissions are not confirmed on this site. Cartaisy requests them when your store connects. An older list of permissions is not the current set.';

export const appStoreAcquisitionTodo =
  'A Shopify App Store install does not create a Cartaisy account. Signup stays invite-only. Claiming a store requires a signed-in store admin. This site does not offer an App Store listing as the way to start.';

export const supportEmail = 'support@cartaisy.com';

/** Short homepage copy. Facts stay aligned with the constants above. */
export const homeManaged =
  'You keep the Shopify store. You own the Apple Developer account, the Google Play account, and the listings under them.';

/** Homepage journey cards. Limits stay in offer details and FAQs, not in these three paths. */
export const homeAudiences = [
  {
    title: 'Already selling on Shopify',
    body: 'Bring your catalog and brand into a mobile shopping experience, with guided setup from Cartaisy.',
  },
  {
    title: 'Planning your Shopify store',
    body: 'You can start the conversation now. Share your plans and explore the steps from store setup to an app.',
  },
  {
    title: 'Exploring your next step',
    body: 'Tell us where your business is today. We’ll help you understand whether a Shopify app fits your plans.',
  },
] as const;

export const homeIncludes = [
  { title: 'Your catalog', body: 'Products sync, including variants and inventory, before a build can start.' },
  { title: 'Your brand', body: 'Name, logo, colors, icon, and splash image. Colors and the logo can update without a new build. The home-screen name, icon, and splash need one.' },
  { title: 'Your home', body: 'Publish a home from the supported modules, or leave the app’s default home.' },
  { title: 'Shopify checkout', body: 'Shoppers pay on Shopify hosted checkout. Cartaisy does not collect card numbers.' },
] as const;

export const homeSteps = [
  { title: 'Check fit', body: 'Tell us about your store. You do not need an account, and this does not connect Shopify.' },
  { title: 'Request a walkthrough', body: 'See the real Connect and Brand screens. We reply by email. The form does not book a calendar.' },
  { title: 'Receive a signup link', body: 'If Cartaisy proceeds, we send a signup link. Open signup is not available.' },
  { title: 'Connect Shopify', body: 'Connect the store from your dashboard. This works for a store where the Cartaisy Shopify app can be installed. An install from the Shopify App Store does not create an account.' },
  { title: 'Sync the catalog', body: 'A build waits until product sync succeeds for your store. A sync on another store does not count.' },
  { title: 'Set the brand and preview', body: 'Set the name, logo, colors, icon, and splash, then preview or publish the home.' },
  { title: 'Request the build', body: 'The dashboard tracks Android and iOS. Publishing uses your Apple Developer and Google Play accounts. Store review stays with Apple and Google.' },
] as const;

export const homePlatform = {
  android:
    'Android: not yet generally available. This site does not offer a download.',
  ios: 'iOS: not ready for a merchant app. Saving an iOS request is not a live iPhone app.',
} as const;

export const homeFaqs: { question: string; answer: string }[] = [
  {
    question: 'How much does it cost?',
    answer: `${managedOffer.structure} ${managedOffer.notIncludedInTheProduct}`,
  },
  {
    question: 'How do I get an account?',
    answer:
      'Accounts are invite-only. Check fit or request a walkthrough. If Cartaisy proceeds, we send a signup link. The login page is for people who already have an account.',
  },
  {
    question: 'Where do shoppers pay?',
    answer: checkoutWording,
  },
  {
    question: 'Who owns the Apple and Google accounts?',
    answer: `${ownership.accounts} ${ownership.expo}`,
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
  {
    question: 'Can I install Cartaisy from the Shopify App Store?',
    answer:
      'No. Installing from the Shopify App Store does not create a Cartaisy account. Signup stays invite-only.',
  },
  {
    question: 'Is the iOS app ready?',
    answer: `${iosReadiness} ${homePlatform.android}`,
  },
];

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
      'Accounts are invite-only. Check fit or request a walkthrough. If Cartaisy proceeds, we send a signup link. The login page is for people who already have an account.',
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
    answer: `${iosReadiness} ${homePlatform.android}`,
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
