import Link from "next/link";
import { BENCHMARKS } from "@/templates/benchmarks";

export default function Home() {
  return (
    <main className="home">
      <h1>Popsy</h1>
      <p>A generic no-code popup builder. Popups are compositions of layout, content, style and action primitives — never business-specific components.</p>
      <p>
        <Link href="/editor">Open the editor →</Link>
      </p>
      <p>
        <Link href="/preview">Preview your saved popup →</Link>
      </p>
      <h2>Examples</h2>
      <p>These are the original samples and never include your edits. Open one in the editor with “Load example…” to customise it.</p>
      <ul>
        {Object.keys(BENCHMARKS).map((id) => (
          <li key={id}>
            <Link href={`/preview?fixture=${id}`}>{id}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
