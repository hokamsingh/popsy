import { notFound } from "next/navigation";
import { CHALLENGES, getChallenge } from "@/learn/library";
import { parseTarget } from "@/learn/scoring";
import TargetView from "./TargetView";

export const generateStaticParams = () => CHALLENGES.map((c) => ({ id: c.id }));
export const metadata = { title: "Target: Popsy", robots: { index: false } };

export default async function TargetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) notFound();
  return <TargetView popup={parseTarget(challenge)} />;
}
