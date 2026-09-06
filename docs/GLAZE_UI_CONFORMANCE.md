# GLAZE UI V1.1 Application Conformance

## Status

**Lifecycle:** Development  
**Target:** GLAZE UI V1.1 / 1.1.0  
**Canonical release anchor:** `GoreeCloud/goreecloud-glaze-ui` tag `v1.1.0`, Stable source commit `15cc76d2bcd4065552dc31c77145b63f34d9e7b2`  
**Application status:** source migration in progress; rendered and production acceptance pending

This record describes the dashboard's current application-specific mapping. It does **not** establish current Glaze UI conformance by declaration. Exact-revision rendered, accessibility, resilience, interaction, and form-factor evidence remains required before the Glaze UI gate can pass.

## Application mapping

### Material hierarchy

The dashboard maps the V1.1 hierarchy as follows:

- **Canvas:** the application background and restrained Deep Teal / Soft Amber atmosphere.
- **Surface:** durable dashboard panels, tables, cards, timelines, and data-reading regions. These are solid or near-solid and must not depend on backdrop blur.
- **Glaze:** the active navigation shell for the current form factor: desktop/sidebar, tablet navigation bar, or phone bottom navigation.
- **Deep Glaze / Live Glaze:** not currently required by this product and therefore not introduced merely for decoration.

The application deliberately limits blur to navigation chrome. Dense repository data and operational decisions remain on durable surfaces.

### Semantic color

Deep Teal is the application interaction accent and Soft Amber is a restrained atmospheric accent. Success, warning, danger, privacy, and security meaning continue to use their existing semantic roles and must not be inferred from decorative atmospheric color.

### Input and target sizing

Touch-capable controls use a 48 px minimum reference target. Keyboard focus remains visible. Hover is supplementary rather than required for primary tasks.

### Form-factor mapping

- **Phone / Compact:** touch-first main content with a reachable bottom navigation surface and no desktop sidebar.
- **Tablet / Medium:** full-label horizontal navigation that uses tablet width intentionally; the previous first-letter rail is no longer the target composition.
- **Desktop / Expanded:** persistent sidebar navigation and pointer/keyboard-oriented workspace.
- **Wide Desktop:** expanded dashboard density while retaining bounded content width and readable panel structure.
- **TV / far-view:** unsupported in the current product scope.

### Accessibility and resilience

The source retains visible focus, skip navigation, Reduced Motion handling, Increased Contrast behavior, Forced Colors behavior, solid-surface fallbacks, and horizontal overflow for dense tables. The V1.1 layer adds a Reduced Transparency fallback and avoids making blur necessary for content comprehension.

### Identity

The application remains text-first because a unique canonical GitHub Dashboard product identity has not been approved. No generic or fabricated icon is treated as canonical.

## Acceptance still required

The following work remains open and blocks a Glaze UI completion claim:

- Rendered acceptance at representative Phone, Tablet, Desktop, and Wide Desktop sizes.
- Light, Dark, and applicable Deep Dark behavior review.
- 200% text and content-reflow validation.
- Keyboard-only task-flow validation and focus-order review.
- Touch interaction review on representative mobile/tablet environments.
- Reduced Motion, Reduced Transparency, Increased Contrast, and Forced Colors rendered review.
- Material/depth and optical-quality review against the exact V1.1 source anchor.
- Final canonical product identity once approved.

Until those gates are completed against an exact dashboard revision, the correct status is **migration in progress / acceptance pending**.
