/**
 * No-login fit check. Three outcomes. No Shopify call.
 */

export const fitStages = ['operating', 'prelaunch', 'not_shopify'] as const;
export const fitGoals = ['branded_app', 'other'] as const;
export const fitOutcomes = ['operating_fit', 'prelaunch_fit', 'website_first'] as const;

export type FitStage = (typeof fitStages)[number];
export type FitGoal = (typeof fitGoals)[number];
export type FitOutcome = (typeof fitOutcomes)[number];

export type FitAnswers = {
  stage: FitStage;
  goal: FitGoal;
};

export type FitResult = {
  outcome: FitOutcome;
  title: string;
  summary: string;
};

const results: Record<FitOutcome, Omit<FitResult, 'outcome'>> = {
  operating_fit: {
    title: 'Cartaisy may fit your store',
    summary:
      'You already sell on Shopify and want a branded shopping app on that catalog. Next, request a walkthrough. If we proceed, we send an invite. This check did not connect Shopify.',
  },
  prelaunch_fit: {
    title: 'Start with the Shopify store',
    summary:
      'You can start the conversation before the store is live. A store URL is optional. The Shopify store still comes before an app can sell. Request a walkthrough to walk through the steps. This check did not connect Shopify.',
  },
  website_first: {
    title: 'Start with your Shopify store',
    summary:
      'Your next step is to establish your Shopify store. You’re welcome to discuss your plans with Cartaisy before exploring an app. This check did not connect Shopify.',
  },
};

export function isFitStage(value: unknown): value is FitStage {
  return typeof value === 'string' && (fitStages as readonly string[]).includes(value);
}

export function isFitGoal(value: unknown): value is FitGoal {
  return typeof value === 'string' && (fitGoals as readonly string[]).includes(value);
}

export function resolveFitOutcome(answers: FitAnswers): FitResult {
  let outcome: FitOutcome = 'website_first';
  if (answers.goal === 'branded_app' && answers.stage === 'operating') {
    outcome = 'operating_fit';
  } else if (answers.goal === 'branded_app' && answers.stage === 'prelaunch') {
    outcome = 'prelaunch_fit';
  }
  return { outcome, ...results[outcome] };
}
