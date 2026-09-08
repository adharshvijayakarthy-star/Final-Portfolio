# AURA refinement verification

Refined from the existing Claude source. The saved baseline is retained locally in `.aura-work/claude-baseline/`.

1. **Preserved animation.** All eleven scenes retain their order and scroll-track timing. Preserved crystal convergence and rush, letter assembly and role choreography, network construction and pulses, scattered-task scheduling, graph construction and prediction, committee-network growth, AURA wireframe/shatter/pause/rebuild, four Beyond depth layers, future horizon and stars, and contact entrance. In a deterministic desktop comparison, 27 sampled sets of transforms/coordinates across nine scenes matched the baseline exactly. This comparison covers motion geometry, not identical text or pixels.

2. **Intermediate states.** Interpolated network core/ring colour changes, planner settling highlights, graph point colour changes, and typed-title character/caret movement. Original motion windows and geometric endpoints remain intact. Ember movement now accounts for elapsed frame time.

3. **Landing morph.** The existing crystal moves from its measured landing bounds into Quick’s matching monolith. Its lettering compresses and dissolves while surrounding geometry draws inward. Quick loads under the handoff; the matching silhouettes exchange material over 180ms. The normal flight is 1.05 seconds. Cancellation and a cleanup timeout prevent a stuck overlay.

4. **Navigation.** Six real chapter links: WHO, BUILD, WORK, BEYOND, FUTURE and CONTACT. The current visible scene drives aria-current; all four projects remain within WORK. Arrival focuses the destination and updates its hash. Direct loading, history and refresh retain meaningful positions. The rail becomes horizontal on smaller screens.

5. **Scroll pacing.** A separate smoothstep controller chooses duration from distance, capped at 4.6 seconds. Measured adjacent chapter journeys were roughly two seconds and WORK to BEYOND about 3.4 seconds in the local production test. Native wheel/touch scrolling is untouched and interrupts travel; scrolling keys and subsequent navigation also cancel it.

6. **Readability.** Resized navigation, labels, supporting prose, project details, contact rows, Build explanations, AURA steps and future labels. Preserved serif/mono hierarchy. Reflowed archive text within the four existing depth layers. Very narrow or short screens use readable document flow, as do reduced motion and disabled JavaScript.

7. **Home identity.** AURA appears in the upper-left on the entrance and Quick. The italic crimson A, hover treatment, focus outline and real home link are implemented in the two existing section components.

8. **Central editing.** `src/data/content.ts` contains identity, section text, navigation, contact values and shared routes. `src/data/projects.ts` contains project copy, narration, signals and deeper destinations. `src/data/site.ts` contains entrance labels and metadata. No new dependencies were introduced.

9. **Working deeper links.** Verified all four destinations and return navigation: `/stay/#study-planner`, `/stay/#past-paper-logger`, `/stay/#strat-mun`, `/stay/#project-aura`. These open the existing editorial project accounts. No external demo or repository URL has been fabricated.

10. **Verified fixes.** Corrected premature chapter selection, competing native smooth-scroll/history restoration, invisible direct chapter openings, oversized mobile caption positioning, archive text overlap, mobile entrance-label obstruction, small-screen narration/diagram collisions, hidden keyboard-focused project links, dummy contact links, and reduced-motion text masks. Lifecycle cleanup avoids duplicate primitives after repeated home/Quick navigation. TypeScript, ESLint and the static production build pass.

11. **Inputs still needed.** Replace the four YOUR_ contact values with your real details. Screenshots, certificate scans and project demo/repository URLs remain optional content inputs; factual text occupies the original frames until supplied.

Browser evidence is stored locally in `.aura-work/qa/`. Testing uses Edge/Chromium, including 320, 390, 768, 1024, 1366 and 1440px viewport samples, short-screen layouts, reduced motion, no JavaScript, enlarged text, forward/reverse scrolling, interrupted navigation and keyboard interaction. Physical iOS/Safari hardware was not available for this verification.
