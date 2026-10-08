import { notFound } from "next/navigation";
import { CHALLENGES, getChallenge } from "@/learn/library";
import ChallengeLoader from "./ChallengeLoader";

export const generateStaticParams = () => CHALLENGES.map((c) => ({ id: c.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const challenge = getChallenge((await params).id);
  return { title: challenge ? `${challenge.title}: Learn & practice` : "Learn & practice" };
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getChallenge(id)) notFound();
  return <ChallengeLoader id={id} />;
}
