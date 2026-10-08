import { ArrowRight, Layers, MousePointerClick, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { PopupRenderer } from "@/runtime/renderer";
import { BENCHMARKS, heroDemo } from "@/templates/benchmarks";
import { EXAMPLES } from "./_home/examples";
import { Thumbnail } from "./_home/Thumbnail";
import styles from "./home.module.css";

const FEATURES = [
  { icon: Layers, title: "Compose, don't configure", text: "Stack, Grid, Text, Image and Button. Every popup is a tree of a few generic blocks." },
  { icon: Smartphone, title: "Responsive by default", text: "Set values per device, and hide or reshape anything on tablet and mobile." },
  { icon: MousePointerClick, title: "Actions you define", text: "Buttons emit events. Your app decides what “claim” or “sign up” means." },
  { icon: ShieldCheck, title: "Safe to ship", text: "Versioned, validated JSON. Unsafe links and CSS are rejected before they render." },
];

export default function Home() {
  return (
    <>
      <header className={styles.hero}>
        <nav className={styles.nav} aria-label="Main">
          <span className={styles.logo}>Popsy</span>
          <div className={styles.navLinks}>
            <Link href="/learn">Learn &amp; practice</Link>
            <Link href="/preview">Your popup</Link>
            <Link href="/demo">Integration demo</Link>
            <Link href="/editor" className={styles.navCta}>
              Open editor
            </Link>
          </div>
        </nav>

        <div className={styles.heroBody}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>No-code popup builder</p>
            <h1 className={styles.title}>
              Design any popup from <span className={styles.highlight}>simple blocks</span>.
            </h1>
            <p className={styles.lead}>
              Drag in layout, text, images and buttons. Style them per device. Connect buttons to your own
              actions. No code, and no template lock-in.
            </p>
            <div className={styles.ctas}>
              <Link href="/editor" className={styles.primary}>
                Start building <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/learn" className={styles.secondary}>
                Learn &amp; practice
              </Link>
              <Link href="/preview" className={styles.secondary}>
                See your saved popup
              </Link>
            </div>
          </div>

          <div className={styles.demo}>
            <PopupRenderer popup={heroDemo()} mode="inline" />
          </div>
        </div>
      </header>

      <main>
        <section className={styles.section} aria-labelledby="features">
          <h2 id="features" className={styles.sectionTitle}>
            Everything is a primitive
          </h2>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={styles.feature}>
                <Icon size={22} aria-hidden />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="examples">
          <h2 id="examples" className={styles.sectionTitle}>
            Made with the same blocks
          </h2>
          <p className={styles.sectionLead}>
            Each example below is built only from generic primitives. Open the editor and pick “Load example…” to
            customise one.
          </p>
          <ul className={styles.gallery}>
            {EXAMPLES.map(({ id, title, blurb }) => (
              <li key={id}>
                <article className={styles.card}>
                  <Thumbnail popup={BENCHMARKS[id]()} />
                  <div className={styles.cardText}>
                    <h3>
                      <Link href={`/preview?fixture=${id}`} className={styles.cardLink}>
                        {title}
                      </Link>
                    </h3>
                    <p>{blurb}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={styles.footer}>Popsy. Popups made from primitives.</footer>
    </>
  );
}
