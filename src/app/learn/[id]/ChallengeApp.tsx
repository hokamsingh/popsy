"use client";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fromPuck, toPuck, type PuckData } from "@/editor/adapters/puck";
import { puckConfig } from "@/editor/puck/config";
import { getChallenge, nextChallenge } from "@/learn/library";
import { clearWork, loadWork, recordAttempt, saveProgress, saveWork } from "@/learn/progress";
import { checkObjectives, scoreAttempt, type ScoreResult } from "@/learn/scoring";
import { HINT_COST, LEVELS, PASS_SCORE } from "@/learn/types";
import { useProgress } from "@/learn/useProgress";
import { createBlankPopup } from "@/templates/blank";
import styles from "../learn.module.css";
import { TargetPreview } from "../TargetPreview";
import { LevelPill, Stars } from "../ui";

const VIEWPORTS = [
  { width: 1100, height: "auto" as const, label: "Desktop" },
  { width: 900, height: "auto" as const, label: "Tablet" },
  { width: 420, height: "auto" as const, label: "Mobile" },
];

const SAVE_DELAY_MS = 400;

const VISUALLY_HIDDEN = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

interface Checked extends ScoreResult {
  improved: boolean;
}

const looksLikePuckData = (v: unknown): v is PuckData => typeof v === "object" && v !== null && Array.isArray((v as PuckData).content);

export default function ChallengeApp({ id }: { id: string }) {
  const challenge = getChallenge(id);
  if (!challenge) return <p style={{ padding: 16 }}>That challenge doesn’t exist. <Link href="/learn">Back to Learn</Link></p>;
  return <Challenge key={id} id={id} />;
}

function Challenge({ id }: { id: string }) {
  const challenge = getChallenge(id)!;
  const following = nextChallenge(id);

  const [data, setData] = useState<PuckData>(() => {
    const saved = loadWork(id);
    return saved && looksLikePuckData(saved.data) ? saved.data : toPuck(createBlankPopup());
  });
  const [hints, setHints] = useState(() => Math.min(loadWork(id)?.hints ?? 0, challenge.hints.length));
  const [loadCount, setLoadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [result, setResult] = useState<Checked | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [copied, setCopied] = useState("");

  const progress = useProgress();

  const attempt = useMemo(() => fromPuck(data), [data]);
  const live = useMemo(() => (attempt.success ? checkObjectives(challenge, attempt.data) : null), [attempt, challenge]);
  const done = live?.filter((o) => o.passed).length ?? 0;

  // Keep unfinished work, so closing the tab doesn't lose it.
  useEffect(() => {
    const timer = setTimeout(() => saveWork(id, { data, hints }), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [id, data, hints]);

  function check() {
    const current = fromPuck(data);
    if (!current.success) {
      setProblems(current.errors.slice(0, 5).map((e) => `${e.path}: ${e.message}`));
      return;
    }
    setProblems([]);
    const scored = scoreAttempt(challenge, current.data, hints);
    const step = recordAttempt(progress, id, scored.score);
    saveProgress(step.progress);
    setResult({ ...scored, improved: step.improved });
  }

  function reset() {
    if (!window.confirm("Start this challenge again from an empty popup?")) return;
    clearWork(id);
    setData(toPuck(createBlankPopup()));
    setHints(0);
    setResult(null);
    setProblems([]);
    setLoadCount((n) => n + 1);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // Clipboard can be blocked; the text is visible to select by hand.
    }
  }

  const overrides = useMemo(
    () => ({
      headerActions: () => (
        <button type="button" className={styles.headerCheck} onClick={check}>
          <Check size={15} aria-hidden /> Check my popup
        </button>
      ),
    }),
    // `check` closes over the latest data, hints and progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, hints, progress, challenge],
  );

  const best = progress[id];

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}>
      {collapsed ? (
        <aside className={styles.panelRail}>
          <button type="button" className={styles.iconBtn} aria-label="Show the challenge panel" onClick={() => setCollapsed(false)}>
            <ChevronRight size={16} aria-hidden />
          </button>
        </aside>
      ) : (
        <aside className={styles.panel} aria-label="Challenge">
          <div className={styles.panelBar}>
            <Link href="/learn">
              <ArrowLeft size={14} aria-hidden /> All challenges
            </Link>
            <button type="button" className={styles.iconBtn} style={{ marginLeft: "auto" }} aria-label="Hide the challenge panel" onClick={() => setCollapsed(true)}>
              <ChevronLeft size={16} aria-hidden />
            </button>
          </div>

          <div className={styles.panelScroll}>
            <div>
              <div className={styles.titleRow}>
                <h1>{challenge.title}</h1>
                <LevelPill level={challenge.level} />
              </div>
              <p className={styles.brief} style={{ marginTop: 6 }}>
                {challenge.brief}
              </p>
              {best && (
                <p className={styles.brief} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <Stars count={best.stars} /> Best score {best.best} · {best.attempts} {best.attempts === 1 ? "try" : "tries"}
                </p>
              )}
            </div>

            <section>
              <h2 className={styles.sectionTitle}>Build this</h2>
              <TargetPreview id={id} />
            </section>

            {challenge.assets && (
              <section>
                <h2 className={styles.sectionTitle}>You’ll need</h2>
                <div className={styles.assets}>
                  {challenge.assets.map((asset) => (
                    <div key={asset.value} className={styles.asset}>
                      <span>{asset.label}</span>
                      <code>{asset.value}</code>
                      <button type="button" onClick={() => copy(asset.value)}>
                        {copied === asset.value ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className={styles.sectionTitle}>
                Checklist <span className={styles.count}>{live ? `${done} of ${live.length}` : "fix the problem below"}</span>
              </h2>
              {live ? (
                <ul className={styles.checks}>
                  {live.map((o) => (
                    <li key={o.id} className={`${styles.check} ${o.passed ? styles.checkDone : ""}`}>
                      <span className={styles.checkMark} aria-hidden>
                        {o.passed && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span>
                        {o.label}
                        <span style={VISUALLY_HIDDEN}>{o.passed ? " (done)" : " (not yet)"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className={styles.problems}>
                  {!attempt.success && attempt.errors.slice(0, 4).map((e) => <li key={`${e.path}${e.message}`}>{`${e.path}: ${e.message}`}</li>)}
                </ul>
              )}
            </section>

            <section>
              <h2 className={styles.sectionTitle}>Hints</h2>
              <div className={styles.hints}>
                {challenge.hints.slice(0, hints).map((hint, i) => (
                  <p key={i} className={styles.hint}>
                    <strong>{i + 1}.</strong> {hint}
                  </p>
                ))}
                {hints < challenge.hints.length ? (
                  <button type="button" className={styles.secondary} style={{ justifySelf: "start" }} onClick={() => setHints((h) => h + 1)}>
                    {hints === 0 ? "Show a hint" : "Show the next hint"} (−{HINT_COST} points)
                  </button>
                ) : (
                  <p className={styles.brief}>That’s every hint.</p>
                )}
              </div>
            </section>

            {problems.length > 0 && (
              <ul className={styles.problems} role="alert">
                <li>Fix these before checking:</li>
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.panelFoot}>
            <button type="button" className={styles.secondary} onClick={reset} aria-label="Start over">
              <RotateCcw size={14} aria-hidden style={{ verticalAlign: "-2px" }} /> Start over
            </button>
            <button type="button" className={styles.primary} onClick={check}>
              Check my popup
            </button>
          </div>
        </aside>
      )}

      <div className={styles.editor}>
        <Puck key={loadCount} config={puckConfig} data={data} viewports={VIEWPORTS} onChange={setData} overrides={overrides as never} />
      </div>

      {result && <ResultDialog result={result} title={challenge.title} levelName={LEVELS[challenge.level].name} hints={hints} nextHref={following ? `/learn/${following.id}` : "/learn"} nextLabel={following ? `Next: ${following.title}` : "Back to all challenges"} onClose={() => setResult(null)} />}
    </div>
  );
}

const BREAKDOWN = [
  ["structure", "Layout"],
  ["content", "Words"],
  ["style", "Styling"],
  ["settings", "Popup settings"],
] as const;

function ResultDialog({
  result,
  title,
  levelName,
  hints,
  nextHref,
  nextLabel,
  onClose,
}: {
  result: Checked;
  title: string;
  levelName: string;
  hints: number;
  nextHref: string;
  nextLabel: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const passedCount = result.objectives.filter((o) => o.passed).length;
  const missing = result.objectives.filter((o) => !o.passed);
  const ring = result.passed ? "#16a34a" : result.score >= 50 ? "#f59e0b" : "#ef4444";
  const verdict = result.score >= 90 ? "Excellent!" : result.passed ? "Challenge passed!" : result.score >= 50 ? "Getting there" : "Keep building";

  const percent = (n: number): ReactNode => `${Math.round(n * 100)}%`;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.result} role="dialog" aria-modal="true" aria-labelledby="result-title" onClick={(e) => e.stopPropagation()}>
        <div className={styles.resultHead}>
          <div className={styles.scoreRing} style={{ ["--pct" as string]: result.score, ["--ring" as string]: ring }}>
            <span>{result.score}</span>
          </div>
          <div>
            <h2 id="result-title">{verdict}</h2>
            <p>
              {title} · {levelName}
            </p>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Stars count={result.stars} size={18} />
              {result.improved && <span className={styles.newBest}>New best</span>}
            </div>
          </div>
        </div>

        <div className={styles.bars}>
          <div className={styles.bar}>
            <span>Checklist</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${(passedCount / Math.max(1, result.objectives.length)) * 100}%` }} />
            </div>
            <span>
              {passedCount}/{result.objectives.length}
            </span>
          </div>
          {BREAKDOWN.map(([key, label]) => (
            <div key={key} className={styles.bar}>
              <span>{label}</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${result.similarity[key] * 100}%` }} />
              </div>
              <span>{percent(result.similarity[key])}</span>
            </div>
          ))}
        </div>

        {result.hintPenalty > 0 && (
          <p className={styles.brief}>
            Score before hints: {result.rawScore}. {hints} {hints === 1 ? "hint" : "hints"} cost {result.hintPenalty} points.
          </p>
        )}

        {missing.length > 0 && (
          <div>
            <h3 className={styles.sectionTitle}>Still to do</h3>
            <ul className={styles.tips}>
              {missing.slice(0, 6).map((o) => (
                <li key={o.id}>{o.label}</li>
              ))}
              {missing.length > 6 && <li>…and {missing.length - 6} more</li>}
            </ul>
          </div>
        )}

        {result.similarity.tips.length > 0 && (
          <div>
            <h3 className={styles.sectionTitle}>Where yours differs</h3>
            <ul className={styles.tips}>
              {result.similarity.tips.slice(0, 5).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.resultActions}>
          <button ref={closeRef} type="button" className={styles.secondary} onClick={onClose}>
            {result.passed ? "Keep polishing" : "Keep editing"}
          </button>
          {result.passed && (
            <Link href={nextHref} className={styles.linkBtn}>
              {nextLabel} →
            </Link>
          )}
        </div>
        {!result.passed && <p className={styles.brief}>Reach {PASS_SCORE} to pass this challenge. You can check as often as you like.</p>}
      </div>
    </div>
  );
}
