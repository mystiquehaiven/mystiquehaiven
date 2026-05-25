// app/pricing/page.tsx
import { Metadata } from "next";
import SubscribePage from "../subscribe/page"; // your current component renamed

export const metadata: Metadata = {
  title: "Membership Plans — MYSTIQUE hAIven",
  description:
    "Subscribe to MYSTIQUE hAIven. AI-generated adult content, paid via Bitcoin. Three tiers: Threshold ($0.99), Standard ($14.99/mo), and Exclusive ($19.99/mo).",
  openGraph: {
    title: "Membership Plans — MYSTIQUE hAIven",
    description:
      "Explore AI-generated adult content with a Bitcoin-only subscription. No card required.",
    url: "https://mystiquehaiven.com/pricing",
  },
};

export default function PricingPage() {
  return <SubscribePage />;
}