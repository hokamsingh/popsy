"use client";
import dynamic from "next/dynamic";

// The editor only runs in the browser.
const ChallengeApp = dynamic(() => import("./ChallengeApp"), { ssr: false, loading: () => <p style={{ padding: 16 }}>Loading the challenge…</p> });

export default function ChallengeLoader({ id }: { id: string }) {
  return <ChallengeApp id={id} />;
}
