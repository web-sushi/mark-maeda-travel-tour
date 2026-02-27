import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing env.STRIPE_SECRET_KEY");
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(stripeSecretKey, {
      // TODO: Pin `apiVersion` once you've chosen a Stripe API version for your account.
      // Leaving this unset uses Stripe's default for the SDK version.
    });
  }

  return stripeSingleton;
}
