import { getStoredConsent, optionalAnalyticsAllowed } from '@/lib/cookies';

type EventParams = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

// Track custom events
export function trackEvent({ action, category, label, value }: EventParams) {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (!optionalAnalyticsAllowed(getStoredConsent())) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Pre-defined events for common actions
export const analytics = {
  // CTA clicks
  ctaClick: (ctaName: string) => {
    trackEvent({
      action: 'cta_click',
      category: 'engagement',
      label: ctaName,
    });
  },

  // Demo requests
  demoRequested: () => {
    trackEvent({
      action: 'demo_requested',
      category: 'conversion',
      label: 'schedule_demo',
    });
  },

  // Newsletter signup
  newsletterSignup: () => {
    trackEvent({
      action: 'newsletter_signup',
      category: 'conversion',
      label: 'footer_form',
    });
  },

  // Contact form submission
  contactFormSubmit: () => {
    trackEvent({
      action: 'contact_form_submit',
      category: 'conversion',
      label: 'contact_page',
    });
  },

  // Video watched
  videoWatched: (videoName: string) => {
    trackEvent({
      action: 'video_watched',
      category: 'engagement',
      label: videoName,
    });
  },

  // Pricing viewed
  pricingViewed: (plan: string) => {
    trackEvent({
      action: 'pricing_viewed',
      category: 'interest',
      label: plan,
    });
  },

  // Documentation viewed
  docsViewed: (page: string) => {
    trackEvent({
      action: 'docs_viewed',
      category: 'engagement',
      label: page,
    });
  },

  // Sign up started
  signupStarted: () => {
    trackEvent({
      action: 'signup_started',
      category: 'conversion',
      label: 'registration',
    });
  },

  // Login completed
  loginCompleted: () => {
    trackEvent({
      action: 'login_completed',
      category: 'authentication',
      label: 'login',
    });
  },

  // Feature interest
  featureInterest: (featureName: string) => {
    trackEvent({
      action: 'feature_interest',
      category: 'interest',
      label: featureName,
    });
  },
};
