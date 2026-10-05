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
      'You already run a Shopify store and want a branded shopping app on that catalog. Cartaisy does not guarantee sales. Next, request a walkthrough. If we proceed, an operator sends an invite. This check did not connect Shopify.',
  },
  prelaunch_fit: {
    title: 'Start with the Shopify store',
    summary:
      'You can talk with Cartaisy before the store is live. A store URL is optional and was not required. Launch the Shopify store before expecting an app to sell. A mobile app does not replace the website and does not guarantee sales. Request a walkthrough if you want to talk. This check did not connect Shopify.',
  },
  website_first: {
    title: 'A mobile app is not the next step',
    summary:
      'Cartaisy is a managed shopping app for a Shopify store. If you are not planning Shopify, or you want custom software, push or loyalty campaigns, or a sales guarantee, stay with the website or another product. This check did not connect Shopify.',
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
