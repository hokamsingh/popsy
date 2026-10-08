import type { Metadata } from "next";
import LearnHome from "./LearnHome";

export const metadata: Metadata = {
  title: "Learn & practice: Popsy",
  description: "Learn to build popups by recreating them, one challenge at a time, and get a score.",
};

export default function LearnPage() {
  return <LearnHome />;
}
