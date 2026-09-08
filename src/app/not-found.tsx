import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

/**
 * Root 404.
 *
 * The root not-found renders outside every route group, so it supplies its own
 * <main>. Deliberately plain: the styled version is a design decision for a
 * later phase, and a broken page should not be the place the art direction
 * makes its first impression.
 */
export default function NotFound() {
  return (
    <main>
      <Section labelledBy="not-found-heading" space="loose">
        <Container width="narrow">
          <p className="t-index">404</p>
          <h1 id="not-found-heading" className="t-display">
            Nothing here
          </h1>
          <p className="t-lead">That page does not exist.</p>
          <p className="t-body">
            <Link href="/">Return to the start</Link>
          </p>
        </Container>
      </Section>
    </main>
  );
}
