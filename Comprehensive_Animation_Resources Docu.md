# Comprehensive Animation Resources Document for AI-Driven Marketing Video Generation

## Document Purpose

This is a **standalone, self-contained reference document** compiling **all** free/open-source, non-Lottie animation resources for 2D web-based motion graphics. It focuses on code-based tools (CSS, JS, SVG, GLSL shaders) for micro-animations, interactions, transitions, UI components, effects, and slide sequences. All resources are lightweight, customizable, and optimized for Puppeteer export (e.g., green-screen rendering for video compositing).

**Key Exclusions**: No Lottie-based resources. No 3D/Three.js (focused on 2D element/slide effects).

### Usage Instructions for AI

This document is designed for **plug-and-play use with any AI**. Provide it verbatim along with:

- **Dialogues**: Sequence of marketing speech (e.g., "Slide 1: 'Unlock endless possibilities...' – 5 seconds, energetic reveal").
- **Video Requirements**: High-level notes (e.g., "Blue theme, upbeat pace, 1080p resolution, sync to speech").

**AI Process** (Follow strictly):

1. **Analyze Input**: Parse dialogues for mood/timing/themes (e.g., "excited" = bounce transitions; "mysterious" = subtle shaders).
2. **Select Resources**: Choose 1-3 from relevant categories (e.g., CSS for simple fades, JS for interactions, shaders for overlays). Access linked sites to fetch code/examples (browse if needed).
3. **Generate Animation**:
   - Create a standalone HTML/JS snippet for each slide/segment.
   - Specs: 1920x1080 viewport, green background (`background: #00ff00;`), animation timed to dialogue duration (e.g., 5s loop), triggered on load/timeline.
   - Ensure: 60fps smoothness, <100KB size, no external deps unless CDN-noted, accessibility (e.g., `@media (prefers-reduced-motion: reduce)`).
4. **Output Per Segment**:
   - **Full Code**: Embeddable HTML + CSS/JS.
   - **Description**: "Uses [Resource Name] for [effect, e.g., staggered text reveal] synced to dialogue."
   - **Customization Notes**: Params for color/speed (e.g., "Change hue via CSS var").
   - **Sequence ID**: "Slide 1 of N" for easy chaining.
5. **Final Compilation**: After all segments, provide a master HTML file concatenating sequences for Puppeteer recording (e.g., via `page.video()`).

**Example AI Prompt**: "Using the provided Animation Resources Document, generate animations for these dialogues: [insert dialogues]. Video reqs: [insert reqs]. Output: Coded segments + master file."

**Date Compiled**: November 21, 2025. Links verified as active; re-check via browsing if expired.

---

## Resource Categories

### 1. CSS Animation Libraries

Pure CSS for performant micro-animations and transitions (e.g., element entrances, hovers for UI emphasis).

| Name                            | Description                                                                         | Key Use Cases                          | Link                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Animate.css                     | 80+ modular classes for fades, bounces, slides (e.g., attention-grabbers for CTAs). | Text reveals, button pulses.           | [https://animate.style](https://animate.style/)                                                     |
| Animista                        | 250+ editable keyframes for hovers, morphs, sequences. Interactive preview/export.  | Slide transitions, text effects.       | [https://animista.net](https://animista.net/)                                                       |
| CSS Loaders                     | 600+ single-element spinners/progress bars.                                         | Loading overlays, dialogue pauses.     | [https://css-loaders.com](https://css-loaders.com/)                                                 |
| FreeFrontend CSS Animations     | 129+ snippets for particles, reveals, hovers. Categorized zips.                     | Interactive cards, background motions. | [https://freefrontend.com/css-animation-examples](https://freefrontend.com/css-animation-examples/) |
| DevSnap CSS Animation Libraries | 50+ packs (e.g., Izmir Hovers, Animatopy) for dynamic elements.                     | Button interactions, list staggers.    | [https://devsnap.me/css-animation-libraries](https://devsnap.me/css-animation-libraries)            |

### 2. JS Animation Libraries

Timeline-based engines for complex sequencing and DOM/SVG manipulations (e.g., staggered reveals for product lists).

| Name                      | Description                                                       | Key Use Cases                            | Link                                                                         |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| Anime.js                  | Lightweight for CSS/SVG/DOM tweens; 100+ examples with timelines. | Path morphs, staggered enters.           | [https://animejs.com](https://animejs.com/)                                  |
| GSAP (GreenSock)          | Precise control for tweens, scrolls, physics. Fully free core.    | Parallax text, elastic bounces.          | [https://gsap.com](https://gsap.com/)                                        |
| Motion (Framer Motion)    | Hooks for gestures/variants; vanilla JS adaptable.                | Drag interactions, variant transitions.  | [https://motion.dev](https://motion.dev/)                                    |
| React Spring              | Physics springs for realistic motions.                            | Elastic UI feedbacks, list animations.   | [https://react-spring.io](https://react-spring.io/)                          |
| Remotion                  | React video framework for programmatic clips.                     | Dialogue-synced renders, full sequences. | [https://www.remotion.dev](https://www.remotion.dev/)                        |
| DevSnap Anime.js Examples | 45+ snippets for paths and interactions.                          | SVG followers, hover effects.            | [https://devsnap.me/anime-js-examples](https://devsnap.me/anime-js-examples) |

### 3. SVG Animation Resources

Vector-based for illustrative, scalable motions (e.g., icon draws, shape morphs for branding).

| Name                                | Description                                                          | Key Use Cases                      | Link                                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| unDraw Illustrations                | 150+ MIT SVGs (e.g., tech scenes); animate via CSS/JS. Color editor. | Background scenes, logo draws.     | [https://undraw.co](https://undraw.co/)                                                                                             |
| SVG Backgrounds Animated Preloaders | 50+ CC0 loaders (waves, orbits). Inline + CSS.                       | Slide intros, abstract overlays.   | [https://www.svgbackgrounds.com/elements/animated-svg-preloaders](https://www.svgbackgrounds.com/elements/animated-svg-preloaders/) |
| Colorlib SVG Animations             | 18+ code examples for strokes/morphs.                                | Icon pulses, interactive graphics. | [https://colorlib.com/wp/svg-animations-examples](https://colorlib.com/wp/svg-animations-examples/)                                 |
| Toools Open-Source Illustrations    | 50+ packs (e.g., Blush); animation-ready. Attribution-free.          | Custom scenes, particle SVGs.      | [https://www.toools.design/free-open-source-illustrations](https://www.toools.design/free-open-source-illustrations)                |
| React Awesome Reveal                | Intersection reveals for SVGs. CSS-driven.                           | Scroll-triggered elements.         | [https://react-awesome-reveal.morello.dev](https://react-awesome-reveal.morello.dev/)                                               |

### 4. 2D Shader/Effects Libraries

GLSL/WebGL for procedural filters and overlays (e.g., glitches, warps on text/elements for emphasis).

| Name                          | Description                                                   | Key Use Cases                         | Link                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shadertoy 2D Effects          | 10,000+ fragment shaders (noise, distortions). Time uniforms. | Wave transitions, glitch filters.     | [https://www.shadertoy.com](https://www.shadertoy.com/)                                                                                           |
| GLSL Sandbox                  | 1,000+ editable 2D shaders (pixel sorts). Boilerplate.        | Element warps, color shifts.          | [http://glslsandbox.com](http://glslsandbox.com/)                                                                                                 |
| GlslCanvas Effects            | 50+ canvas shaders (ripples, gradients). JS loader.           | Overlay effects, dynamic backgrounds. | [https://github.com/mattdesl/glslify](https://github.com/mattdesl/glslify) (demos)                                                                |
| FreeFrontend 2D WebGL Shaders | 30+ snippets (blurs, glows).                                  | Vignette on products, edge effects.   | [https://freefrontend.com/webgl](https://freefrontend.com/webgl/)                                                                                 |
| Awwwards WebGL Shader Codes   | 20+ 2D effects (melts, particles). Downloadable.              | Abstract transitions, video filters.  | [https://www.awwwards.com/awwwards/collections/webgl-shaders-code](https://www.awwwards.com/awwwards/collections/webgl-shaders-code/)             |
| WebGL-Shaders Examples        | 20+ GLSL demos (rain, tiles).                                 | Procedural particles, 2D simulations. | [https://webgl-shaders.com](https://webgl-shaders.com/)                                                                                           |
| ShaderFrog                    | 500+ composable shaders. Node graphs.                         | Layered effects, multi-pass warps.    | [https://shaderfrog.com](https://shaderfrog.com/)                                                                                                 |
| Shader Park                   | 100+ primitives (fractals, growths). JS API.                  | Organic motions, generative art.      | [https://shaderpark.com](https://shaderpark.com/)                                                                                                 |
| VFX-JS Effects                | 30+ GLSL for DOM effects (glitches, liquids).                 | Image/video filters, transitions.     | [https://tympanus.net/codrops/2025/01/20/vfx-js-webgl-effects-made-easy](https://tympanus.net/codrops/2025/01/20/vfx-js-webgl-effects-made-easy/) |

### 5. Micro-Interactions & UI Component Libraries

Animated, accessible components for interactive elements (e.g., hover cards, modals in ads).

| Name         | Description                                                         | Key Use Cases               | Link                                                                                 |
| ------------ | ------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Magic UI     | 150+ Tailwind/React components (confetti, tooltips). Framer Motion. | CTA bursts, dropdowns.      | [https://magicui.design](https://magicui.design/)                                    |
| Kokonut UI   | Animated React/Tailwind (springs, hovers).                          | Accessible buttons, forms.  | [https://kokonutui.com](https://kokonutui.com/)                                      |
| React-Motion | Physics for UI tweens.                                              | Drag feedbacks, list items. | [https://github.com/chenglou/react-motion](https://github.com/chenglou/react-motion) |
| React Move   | Data-driven for charts/lists.                                       | Graph enters, dynamic UIs.  | [https://react-move-docs.netlify.app](https://react-move-docs.netlify.app/#/)        |
| react-anime  | Anime.js for props/attributes.                                      | Button tweens, SVG attrs.   | [https://github.com/plus1tv/react-anime](https://github.com/plus1tv/react-anime)     |

### 6. Transition & Slider Libraries

For deck-like sequences (e.g., speech-synced slides with flips/effects).

| Name                    | Description                            | Key Use Cases                        | Link                                                |
| ----------------------- | -------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| Swiper Animated Sliders | 40+ effects (cubes, covers). Touch/JS. | Presentation transitions, carousels. | [https://swiperjs.com/demos](https://swiperjs.com/) |

---

## Best Practices for Generation

- **Performance**: Use `transform`/`opacity` for animations; avoid layout thrashing.
- **Syncing**: Align effects to dialogue timestamps (e.g., via JS `setTimeout` or timelines).
- **Green Screen**: All outputs must include `<div style="background: #00ff00; width: 1920px; height: 1080px; position: relative;">` wrapper.
- **Testing**: Outputs should run standalone in a browser for preview.
