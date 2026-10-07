/**
 * Small, progressive motion layer shared by all pages.
 * client.js owns scroll reveals, dialogs and the gallery; this module prepares
 * their line masks/staggers, adds photo depth and handles page/hero transitions.
 * No scroll hijacking, external library, duplicated accessible text or layout
 * writes on scroll. Reduced motion can be enabled while the page is open.
 */
(() => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const isQuiet = () => preference.matches;
  let frame = 0;
  let navigationTimer = 0;
  let photoObserver;
  let heroObserver;
  let heroVisible = true;
  let heroOffset = 0;
  let hero;
  const visiblePhotos = new Set();
  const photoStates = new Map();

  function prepareLines() {
    document.querySelectorAll(".display").forEach((heading) => {
      [...heading.children]
        .filter((child) => child.tagName === "SPAN")
        .forEach((line, index) => {
          if (line.classList.contains("motion-line")) return;
          const inner = document.createElement("span");
          inner.className = "motion-line-inner";
          inner.textContent = line.textContent;
          line.replaceChildren(inner);
          line.classList.add("motion-line");
          line.style.setProperty("--line-delay", `${index * 0.13}s`);
        });
    });
  }

  function prepareReveals() {
    const selectors = [
      ".gallery-grid > .gallery-item",
      ".villa-gallery > .gallery-item",
      ".gallery-preview > .gallery-item",
      ".contact-banner > .container > div",
      ".footer-top > div",
      ".facts-strip p",
      ".included-row > span",
      ".about-closing",
    ];
    document.querySelectorAll(selectors.join(",")).forEach((element) => {
      if (!element.closest("[data-reveal]")) element.dataset.reveal = "";
    });
    document.querySelectorAll(".display").forEach((heading) => {
      if (!heading.closest(".hero, [data-reveal]")) heading.dataset.reveal = "";
    });
    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => element.classList.add("motion-enter"));
    document
      .querySelectorAll(
        ".activity-grid,.gallery-grid,.villa-gallery,.conditions-grid,.process-steps,.timeline,.footer-top,.facts-strip>.container",
      )
      .forEach((group) => {
        group.classList.add("motion-stagger");
        [...group.children].forEach((element, index) => {
          element.style.setProperty(
            "--motion-delay",
            `${Math.min(index % 3, 2) * 0.12}s`,
          );
        });
      });
    document.addEventListener("focusin", (event) => {
      for (
        let parent = event.target.closest("[data-reveal]");
        parent;
        parent = parent.parentElement?.closest("[data-reveal]")
      ) {
        parent.classList.remove("reveal-pending");
        parent.classList.add("is-visible", "keyboard-revealed");
      }
    });
  }

  function preparePhotos() {
    const containers = document.querySelectorAll(
      ".hero-image,.sunset-image,.editorial-image,.intro-main,.intro-small,.activity-photo,.offer-image,.gallery-preview > .gallery-item",
    );
    containers.forEach((container) => {
      const image = container.querySelector(":scope > img");
      if (!image) return;
      container.classList.add("motion-image");
      image.classList.add("motion-image-target");
      container.dataset.motionParallax = "";
      container.style.setProperty("--image-scale", "1.10");
      photoStates.set(container, { position: 0 });
    });
    if (!("IntersectionObserver" in window)) return;
    photoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting
            ? visiblePhotos.add(entry.target)
            : visiblePhotos.delete(entry.target),
        );
        schedule();
      },
      { rootMargin: "15% 0px" },
    );
    photoStates.forEach((_, container) => photoObserver.observe(container));
    hero = document.querySelector(".hero");
    if (hero) {
      heroObserver = new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
        schedule();
      });
      heroObserver.observe(hero);
    }
  }

  function renderDepth() {
    frame = 0;
    if (isQuiet() || document.hidden) return;
    const viewport = window.innerHeight;
    const compact = window.innerWidth <= 650;
    let settling = false;
    // Read every position first, then write composited transforms in one batch.
    const updates = [...visiblePhotos].map((container) => {
      const rectangle = container.getBoundingClientRect();
      const phase = Math.max(
        -1,
        Math.min(
          1,
          (viewport / 2 - rectangle.top - rectangle.height / 2) /
            (viewport / 2 + rectangle.height / 2),
        ),
      );
      const amplitude = Math.min(compact ? 14 : 34, rectangle.height * 0.035);
      const target = phase * amplitude;
      const state = photoStates.get(container);
      state.position += (target - state.position) * 0.16;
      if (Math.abs(target - state.position) > 0.12) settling = true;
      else state.position = target;
      return [container, `${state.position.toFixed(2)}px`];
    });
    let opacity = 1;
    if (hero && heroVisible) {
      const rectangle = hero.getBoundingClientRect();
      const distance = Math.max(0, -rectangle.top);
      const target = Math.min(
        distance * (compact ? 0.12 : 0.29),
        rectangle.height * 0.25,
      );
      heroOffset += (target - heroOffset) * 0.16;
      if (Math.abs(target - heroOffset) > 0.12) settling = true;
      opacity = 1 - Math.min(1, distance / rectangle.height) * 0.4;
    }
    updates.forEach(([container, value]) =>
      container.style.setProperty("--parallax-y", value),
    );
    if (hero && heroVisible) {
      hero.style.setProperty("--hero-offset", `${heroOffset.toFixed(2)}px`);
      hero.style.setProperty("--hero-opacity", opacity.toFixed(3));
    }
    if (settling) frame = requestAnimationFrame(renderDepth);
  }

  function schedule() {
    if (!frame && !isQuiet() && !document.hidden)
      frame = requestAnimationFrame(renderDepth);
  }

  function resetMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    heroOffset = 0;
    hero?.style.setProperty("--hero-offset", "0px");
    hero?.style.setProperty("--hero-opacity", "1");
    photoStates.forEach((state, container) => {
      state.position = 0;
      container.style.setProperty("--parallax-y", "0px");
    });
    document.body.classList.remove("page-leaving");
    root.classList.add("motion-hero-ready");
  }

  function prepareHeroScenes() {
    const sceneHero = document.querySelector(".home-hero");
    const container = sceneHero?.querySelector(".hero-image");
    const controls = [...document.querySelectorAll("[data-hero-scene]")];
    if (!container || !controls.length) return;
    const scenes = new Map();
    let selected = null;
    let intent = 0;

    function clear() {
      clearTimeout(intent);
      selected = null;
      scenes.forEach((image) => image.classList.remove("scene-visible"));
      controls.forEach((control) => control.classList.remove("scene-active"));
    }
    function activate(control) {
      if (isQuiet()) return;
      clearTimeout(intent);
      selected = control;
      intent = window.setTimeout(() => {
        let image = scenes.get(control);
        if (!image) {
          image = document.createElement("img");
          image.className = "hero-scene motion-image-target";
          image.alt = "";
          image.setAttribute("aria-hidden", "true");
          image.decoding = "async";
          image.sizes = "(max-width: 650px) 1000px, 100vw";
          image.srcset = control.dataset.sceneSrcset;
          image.src = control.dataset.heroScene;
          image.addEventListener("load", () => {
            if (selected === control) image.classList.add("scene-visible");
          });
          container.append(image);
          scenes.set(control, image);
        }
        scenes.forEach((scene, key) =>
          scene.classList.toggle(
            "scene-visible",
            key === control && scene.complete && Boolean(scene.naturalWidth),
          ),
        );
        controls.forEach((key) =>
          key.classList.toggle("scene-active", key === control),
        );
      }, 80);
    }
    controls.forEach((control) => {
      control.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") activate(control);
      });
      control.addEventListener("pointerleave", clear);
      control.addEventListener("focus", () => activate(control));
      control.addEventListener("blur", clear);
    });
    preference.addEventListener("change", (event) => {
      if (event.matches) clear();
    });
  }

  function prepareNavigation() {
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (
        !anchor ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        isQuiet()
      )
        return;
      if (
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const destination = new URL(anchor.href, location.href);
      if (
        !/^https?:$/.test(destination.protocol) ||
        destination.origin !== location.origin ||
        destination.pathname === location.pathname ||
        destination.pathname.startsWith("/assets/")
      )
        return;
      event.preventDefault();
      if (navigationTimer) return;
      document.body.classList.add("page-leaving");
      navigationTimer = window.setTimeout(
        () => location.assign(destination.href),
        320,
      );
    });
    window.addEventListener("pageshow", () => {
      document.body.classList.remove("page-leaving");
      navigationTimer = 0;
      schedule();
    });
    window.addEventListener("pagehide", () => {
      clearTimeout(navigationTimer);
      navigationTimer = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      document.body.classList.remove("page-leaving");
    });
  }

  function prepareGalleryMotion() {
    document.querySelectorAll("[data-gallery]").forEach((gallery) => {
      gallery.addEventListener("corsica:gallery-filter", () => {
        if (isQuiet()) return;
        [...gallery.querySelectorAll("[data-gallery-item]")]
          .filter((item) => !item.hidden)
          .forEach((item, index) => {
            item.classList.remove("reveal-pending");
            item.classList.add("is-visible");
            item.animate?.(
              [
                { opacity: 0, transform: "translateY(22px) scale(.98)" },
                { opacity: 1, transform: "translateY(0) scale(1)" },
              ],
              {
                duration: 550,
                delay: (index % 3) * 65,
                easing: "cubic-bezier(.2,.65,.3,1)",
              },
            );
          });
      });
    });
    document
      .querySelector("[data-lightbox-image]")
      ?.addEventListener("load", (event) => {
        if (isQuiet() || !event.target.closest("dialog")?.open) return;
        event.target.animate?.(
          [
            { opacity: 0.4, transform: "scale(1.025)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 320, easing: "ease-out" },
        );
      });
    preference.addEventListener("change", (event) => {
      if (event.matches)
        document.getAnimations?.().forEach((animation) => animation.cancel());
    });
  }

  function initialize() {
    prepareLines();
    prepareReveals();
    preparePhotos();
    prepareHeroScenes();
    prepareGalleryMotion();
    prepareNavigation();
    const activate = () => {
      // Scroll content can be masked only after client.js installed its observer.
      root.classList.add("motion-ready");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => root.classList.add("motion-hero-ready")),
      );
    };
    if (root.dataset.clientReady === "true") activate();
    else
      document.addEventListener("corsica:client-ready", activate, {
        once: true,
      });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    });
    preference.addEventListener("change", (event) =>
      event.matches ? resetMotion() : schedule(),
    );
    if (preference.matches) resetMotion();
    else schedule();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
