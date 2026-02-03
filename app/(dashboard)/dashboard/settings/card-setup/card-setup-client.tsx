"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Check, AlertCircle } from "lucide-react";

// Get publishable key from environment
const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables",
    );
    return null;
  }
  return key;
};

const stripePromise = getStripePublishableKey()
  ? loadStripe(getStripePublishableKey()!)
  : null;

interface CardSetupClientProps {
  setupIntentId: string;
  clientSecret: string;
}

function CardSetupForm({
  setupIntentId,
  clientSecret,
}: {
  setupIntentId: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const t = useTranslations("cardSetup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError(t("errorCardElement"));
      setIsLoading(false);
      return;
    }

    try {
      console.log("Confirming setup intent with client secret...");
      console.log("Client secret:", clientSecret.substring(0, 20) + "...");

      // First, let's check if we can retrieve the setup intent to see its current state
      // But we can't do that from client side, so we'll just try to confirm

      // Confirm setup intent with client secret
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        console.error("Stripe confirmCardSetup error:", result.error);
        console.error("Error details:", {
          type: result.error.type,
          code: result.error.code,
          message: result.error.message,
          decline_code: result.error.decline_code,
          param: result.error.param,
        });

        // Handle specific error codes
        if (result.error.code === "setup_intent_unexpected_state") {
          setError(t("errorSessionExpired"));
        } else {
          setError(result.error.message || t("errorConfirm"));
        }
        setIsLoading(false);
        return;
      }

      if (!result.setupIntent) {
        console.error("No setup intent returned from confirmCardSetup");
        setError(t("errorNoResponse"));
        setIsLoading(false);
        return;
      }

      console.log(
        "Setup intent confirmed:",
        result.setupIntent.id,
        "Status:",
        result.setupIntent.status,
      );

      // Check if setup intent succeeded
      if (result.setupIntent.status !== "succeeded") {
        console.warn(
          "Setup intent not succeeded, status:",
          result.setupIntent.status,
        );
        setError(t("errorStatus", { status: result.setupIntent.status }));
        setIsLoading(false);
        return;
      }

      // Wait a moment for Stripe to process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validate card (pre-authorization)
      const validateResponse = await fetch("/api/stripe/validate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup_intent_id: setupIntentId,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || validateData.error) {
        console.error("Validation error:", validateData);
        setError(
          validateData.error || validateData.message || t("errorValidation"),
        );
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/settings");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      console.error("Card setup error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(t("errorGeneric", { message }));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-[#111827] mb-2">
          {t("cardSaved")}
        </h3>
        <p className="text-sm text-[#64748B]">{t("redirecting")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-2">
          {t("cardInfoLabel")}
        </label>
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#020617",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#dc2626",
                },
              },
              // Disable "Save with link" feature
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            t("saveCard")
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-[#111827] rounded-xl font-medium transition-colors"
        >
          {t("cancel")}
        </button>
      </div>

      <p className="text-xs text-[#64748B] text-center">
        {t("validationDisclaimer")}
      </p>
    </form>
  );
}

export default function CardSetupClient({
  setupIntentId,
  clientSecret,
}: CardSetupClientProps) {
  const t = useTranslations("cardSetup");
  const tSettings = useTranslations("settings");
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    if (stripePromise) {
      stripePromise.then(() => setStripeLoaded(true));
    }
  }, []);

  if (!getStripePublishableKey()) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            {t("configMissing")}
          </h3>
          <p className="text-sm text-[#64748B] mb-4">
            {t("configMissingDesc")}
          </p>
          <p className="text-xs text-[#64748B]">{t("configMissingHint")}</p>
        </div>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#2563eb",
        colorBackground: "#ffffff",
        colorText: "#020617",
        colorDanger: "#dc2626",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  if (!stripeLoaded) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#64748B]">{t("loadingStripe")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#111827] mb-1">
          {t("title")}
        </h2>
        <p className="text-sm text-[#64748B]">{t("subtitle")}</p>
        <p className="text-sm text-[#64748B] mt-1">{tSettings("cardUsage")}</p>
      </div>

      {/* Security notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-[#1D4ED8]" />
          </div>
          <div>
            <p className="text-sm text-[#1D4ED8] font-medium mb-1">
              {t("securedByStripe")}
            </p>
            <p className="text-xs text-[#64748B]">{t("stripeDisclaimer")}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        {stripePromise && (
          <Elements options={options} stripe={stripePromise}>
            <CardSetupForm
              setupIntentId={setupIntentId}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
