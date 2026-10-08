"use client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CHALLENGES, TRACKS, challengesIn } from "@/learn/library";
import { summarize } from "@/learn/progress";
import { parseTarget } from "@/learn/scoring";
import { PASS_SCORE } from "@/learn/types";
import { useProgress } from "@/learn/useProgress";
import { Thumbnail } from "../_home/Thumbnail";
import styles from "./learn.module.css";
import { isPhoneOnly, LevelPill, Stars } from "./ui";

export default function LearnHome() {
  const progress = useProgress();

  const ids = useMemo(() => CHALLENGES.map((c) => c.id), []);
  const total = useMemo(() => summarize(progress, ids), [progress, ids]);
  const next = CHALLENGES.find((c) => (progress[c.id]?.best ?? 0) < PASS_SCORE) ?? CHALLENGES[0];
  const started = Object.keys(progress).length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/" className={styles.logo} style={{ color: "#fff" }}>
            Popsy
          </Link>
          <div className={styles.navLinks}>
            <Link href="/editor" style={{ color: "rgba(255,255,255,0.85)" }}>Editor</Link>
            <Link href="/demo" style={{ color: "rgba(255,255,255,0.85)" }}>Integration demo</Link>
          </div>
        </nav>
        <div className={styles.heroBody}>
          <h1>Learn by recreating.</h1>
          <p>
            Every challenge shows you a finished popup. Build one that looks and behaves the same in the real editor, press Check, and get a
            score out of 100. {CHALLENGES.length} challenges, from your first button to lists and app actions.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>
                {total.completed} / {CHALLENGES.length}
              </strong>
              <span>challenges passed</span>
            </div>
            <div className={styles.stat}>
              <strong>
                {total.stars} / {CHALLENGES.length * 3}
              </strong>
              <span>stars earned</span>
            </div>
          </div>
          <Link href={`/learn/${next.id}`} className={styles.heroCta}>
            {started ? `Continue: ${next.title}` : "Start with the first challenge"} <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>

      <main className={styles.main}>
        {TRACKS.map((track) => {
          const list = challengesIn(track.id);
          const sum = summarize(progress, list.map((c) => c.id));
          return (
            <section key={track.id} className={styles.track} aria-labelledby={`track-${track.id}`}>
              <div className={styles.trackHead}>
                <h2 id={`track-${track.id}`}>{track.name}</h2>
                <p>{track.blurb}</p>
                <span className={styles.trackCount}>
                  {sum.completed} of {list.length} passed
                </span>
              </div>
              <div className={styles.grid}>
                {list.map((challenge) => {
                  const result = progress[challenge.id];
                  const target = parseTarget(challenge);
                  return (
                    <article key={challenge.id} className={`${styles.card} ${challenge.id === next.id ? styles.cardNext : ""}`}>
                      <div className={styles.thumbWrap}>
                        <Thumbnail popup={target} />
                        {isPhoneOnly(target) && <span className={styles.phoneNote}>Shows on phones only</span>}
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>
                          <h3>
                            <Link href={`/learn/${challenge.id}`} className={styles.cardLink}>
                              {challenge.title}
                            </Link>
                          </h3>
                          <LevelPill level={challenge.level} />
                        </div>
                        <p className={styles.cardBrief}>{challenge.brief}</p>
                        <div className={styles.tags}>
                          {challenge.learn.slice(0, 3).map((item) => (
                            <span key={item} className={styles.tag}>
                              {item}
                            </span>
                          ))}
                        </div>
                        <div className={styles.cardFoot}>
                          <Stars count={result?.stars ?? 0} />
                          {result ? <span>Best {result.best}</span> : <span>Not tried yet</span>}
                          <span className={styles.go}>{result ? (result.best >= PASS_SCORE ? "Replay" : "Try again") : "Start"} →</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
