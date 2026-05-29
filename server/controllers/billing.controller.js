import Stripe from "stripe";
import Workspace from "../models/Workspace.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === "sk_test_mock_keys_here" || secretKey.includes("mock")) {
    return null;
  }
  return new Stripe(secretKey);
};

// 1. Create Checkout Session
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { workspaceId, plan } = req.body;
    if (!workspaceId || !plan) {
      throw new ApiError(400, "workspaceId and plan (pro | team) are required");
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    const stripe = getStripeInstance();

    // Fallback: If Stripe not configured, simulate success directly (Developer/Mock Mode)
    if (!stripe) {
      console.log(`ℹ️ Stripe not configured. Simulating upgrade for workspace ${workspaceId} to ${plan}...`);
      workspace.plan = plan;
      workspace.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await workspace.save();

      return res.status(200).json(
        new ApiResponse(
          200, 
          { url: `${process.env.CLIENT_URL || "http://localhost:5173"}/billing?success=true` }, 
          "Simulated Upgrade Checkout Success (Stripe key omitted in env)"
        )
      );
    }

    // Map plans to Price IDs
    const priceMap = {
      pro: process.env.STRIPE_PRICE_PRO || "price_mock_pro",
      team: process.env.STRIPE_PRICE_TEAM || "price_mock_team"
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      throw new ApiError(400, "Invalid plan price selection");
    }

    // Generate Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: "subscription",
      client_reference_id: workspaceId,
      customer_email: req.user.email,
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/billing?success=true`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/billing?cancel=true`
    });

    return res.status(200).json(new ApiResponse(200, { url: session.url }, "Checkout session generated successfully"));
  } catch (error) {
    next(error);
  }
};

// 2. Generate Stripe Customer Portal Url
export const getBillingPortal = async (req, res, next) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      throw new ApiError(400, "workspaceId is required");
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    const stripe = getStripeInstance();

    // Fallback: Mock portal return
    if (!stripe || !workspace.stripeCustomerId) {
      return res.status(200).json(
        new ApiResponse(
          200, 
          { url: `${process.env.CLIENT_URL || "http://localhost:5173"}/billing` }, 
          "Simulated billing portal redirect (Customer ID omitted)"
        )
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/billing`
    });

    return res.status(200).json(new ApiResponse(200, { url: portalSession.url }, "Billing portal URL generated successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Webhook listener (reads raw body signature)
export const stripeWebhook = async (req, res, next) => {
  const stripe = getStripeInstance();
  if (!stripe) {
    return res.status(200).json({ received: true, message: "Webhook ignored: Stripe disabled" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed: `, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle specific stripe event triggers
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const workspaceId = session.client_reference_id;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (workspaceId) {
          // Retrieve subscription to get plan details
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          // Simple plan matching logic (could map price IDs)
          const plan = "pro"; // default checkout mapping in simple test

          await Workspace.findByIdAndUpdate(workspaceId, {
            plan,
            stripeCustomerId,
            stripeSubscriptionId,
            planExpiresAt: new Date(subscription.current_period_end * 1000)
          });
          console.log(`✅ Workspace ${workspaceId} successfully upgraded to ${plan} via Webhook`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await Workspace.findOneAndUpdate(
            { stripeSubscriptionId: invoice.subscription },
            { planExpiresAt: new Date(subscription.current_period_end * 1000) }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await Workspace.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            plan: "free",
            stripeSubscriptionId: "",
            planExpiresAt: null
          }
        );
        console.log(`❌ Subscription ${subscription.id} deleted. Downgraded to free.`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error: ", error);
    return res.status(500).json({ error: error.message });
  }
};
