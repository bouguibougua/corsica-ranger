import { languages, pathFor } from "./routes.mjs";
import { reviewSelection, googleSummary } from "./reviews.mjs";
import { createSiteConfig } from "./site-config.mjs";

const E = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const lines = (value) =>
  E(Array.isArray(value) ? value.join("\n") : value)
    .split("\n")
    .map((line) => `<span>${line}</span>`)
    .join("\n");
const arrow =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" stroke-width="1.6"/></svg>';
const icons = {
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  phone:
    '<path d="m8 3-4 1c-2 8 8 18 16 16l1-4-5-3-2 3c-3-1-5-3-6-6l3-2-3-5Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  menu: '<path d="M3 7h18M3 16h18"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
};
const icon = (name) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.pin}</svg>`;
const googleUrl =
  "https://www.google.com/maps/place/?q=place_id:ChIJy-pCtPxpqhIRcWBwS7Ea1Qc";
const socialUrls = {
  Instagram: "https://www.instagram.com/corsicaranger/",
  Facebook: "https://www.facebook.com/corsicaranger/?locale=fr_FR",
  TikTok: "https://www.tiktok.com/tag/corsicarangers",
};
const docs = {
  charter:
    "https://corsicaranger.com/images/2026/Charte-de-bon_comportement.pdf",
  contract:
    "https://corsicaranger.com/images/2026/quad/04-contrats/contrat-de-location-quad.pdf",
  terms:
    "https://corsicaranger.com/images/2026/quad/04-contrats/conditions-generales-de-location.pdf",
};

export function renderPage({ page, lang, t, assets, siteUrl }) {
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date());
  const { basePath, publicPath, absoluteUrl } = createSiteConfig(siteUrl);
  const scopeImage = (item) => ({
    ...item,
    src: publicPath(item.src),
    srcset: item.srcset
      .split(",")
      .map((entry) => {
        const [path, width] = entry.trim().split(/\s+/);
        return `${publicPath(path)} ${width}`;
      })
      .join(", "),
  });
  const photos = Object.fromEntries(
    Object.entries(assets.photos).map(([key, item]) => [key, scopeImage(item)]),
  );
  const gallery = assets.gallery.map(scopeImage);
  const villaPhotos = Object.fromEntries(
    Object.entries(assets.villaPhotos).map(([key, items]) => [
      key,
      items.map(scopeImage),
    ]),
  );
  const url = (key) => publicPath(pathFor(key, lang));
  const external = (href, label, className = "text-link") =>
    `<a class="${className}" href="${E(href)}" target="_blank" rel="noopener noreferrer">${E(label)}${arrow}</a>`;
  const button = (href, label, style = "", isExternal = false) =>
    `<a class="button ${style}" href="${E(href)}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}><span>${E(label)}</span>${arrow}</a>`;
  const photo = (
    item,
    {
      eager = false,
      className = "",
      sizes = "(max-width: 700px) 100vw, 50vw",
      alt,
    } = {},
  ) =>
    `<img class="${className}" src="${E(item.src)}" srcset="${E(item.srcset)}" sizes="${E(sizes)}" width="${item.width}" height="${item.height}" alt="${E(alt ?? item.alt[lang])}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>`;
  const label = (value) =>
    `<p class="eyebrow"><span class="label-line" aria-hidden="true"></span>${E(value)}</p>`;
  const heading = (value, tag = "h2", className = "") =>
    `<${tag}${tag === "h1" ? ' id="hero-title"' : ""} class="display ${className}">${lines(value)}</${tag}>`;
  const headingBlock = (eyebrow, title, text = "") =>
    `<div class="section-heading" data-reveal>${label(eyebrow)}${heading(title)}${text ? `<p class="section-description">${E(text)}</p>` : ""}</div>`;
  const logo = () =>
    `<img class="brand-logo" src="${publicPath("/assets/logo.png")}" alt="Corsica Ranger" width="410" height="68">`;
  const navIds = [
    "home",
    "buggy",
    "quad",
    "houses",
    "about",
    "gallery",
    "contact",
  ];
  const navLinks = () =>
    navIds
      .map(
        (id) =>
          `<a href="${url(id)}"${page === id ? ' aria-current="page"' : ""}>${E(t.nav[id])}</a>`,
      )
      .join("");
  const languageLinks = () =>
    `<div class="language-links" role="group" aria-label="${E(t.ui.language)}">${languages.map((code) => `<a href="${publicPath(pathFor(page, code))}" lang="${code}" hreflang="${code}" aria-label="${{ fr: "Français", en: "English", it: "Italiano" }[code]}"${lang === code ? ' aria-current="true"' : ""}>${{ fr: "🇫🇷", en: "🇬🇧", it: "🇮🇹" }[code]} <span>${code.toUpperCase()}</span></a>`).join("")}</div>`;
  const header = `<a class="skip-link" href="#main">${E(t.ui.skip)}</a><header class="site-header"><div class="header-inner"><a class="brand" href="${url("home")}">${logo()}</a><nav class="desktop-nav" aria-label="${E(t.nav.home)}">${navLinks()}</nav><div class="header-actions"><details class="language-picker"><summary aria-label="${E(t.ui.language)}">${{ fr: "🇫🇷", en: "🇬🇧", it: "🇮🇹" }[lang]} ${lang.toUpperCase()}<span aria-hidden="true">⌄</span></summary>${languageLinks()}</details>${button(url("contact"), t.nav.book, "small")}<button class="menu-toggle icon-button" data-menu-open aria-label="${E(t.ui.openMenu)}" aria-controls="mobile-menu" aria-expanded="false">${icon("menu")}</button></div></div></header><dialog id="mobile-menu" aria-label="${E(t.ui.openMenu)}"><div class="mobile-menu-top"><a class="brand" href="${url("home")}">${logo()}</a><button class="icon-button" data-menu-close aria-label="${E(t.ui.closeMenu)}">${icon("close")}</button></div><nav class="mobile-nav" aria-label="${E(t.ui.openMenu)}">${navLinks()}</nav><div class="mobile-menu-bottom">${languageLinks()}${button(url("contact"), t.nav.book)}<a class="mobile-phone" href="tel:+33495703620">04 95 70 36 20</a></div></dialog>`;
  const footer = `<footer class="site-footer"><div class="container"><div class="footer-top"><div class="footer-brand"><a href="${url("home")}">${logo()}</a><p class="footer-tagline">${E(t.footer.tagline)}</p><p>${E(t.footer.text)}</p></div><div class="footer-nav"><p class="eyebrow">${E(t.footer.explore)}</p>${navIds
    .filter((id) => id !== "home")
    .map((id) => `<a href="${url(id)}">${E(t.nav[id])}</a>`)
    .join(
      "",
    )}</div><div class="footer-contact"><p class="eyebrow">${E(t.footer.find)}</p><a href="tel:+33495703620">04 95 70 36 20</a><a href="tel:+33680437013">06 80 43 70 13</a><a class="email-link" href="mailto:corsicaranger2a@gmail.com">corsicaranger2a@gmail.com</a><address>Route de Canetto · Peroxi<br>20169 Bonifacio · ${E(t.region.island)}</address></div><div class="footer-social"><p class="eyebrow">${E(t.footer.follow)}</p>${Object.entries(
    socialUrls,
  )
    .map(([name, href]) => external(href, name))
    .join(
      "",
    )}${languageLinks()}</div></div><div class="footer-bottom"><p>© <span data-year>${year}</span> Corsica Ranger · SARL Belle Île. ${E(t.footer.rights)}</p><div><a href="${url("legal")}">${E(t.footer.legal)}</a><a href="${url("privacy")}">${E(t.footer.privacy)}</a><a href="#top" aria-label="${E(t.ui.top)}">↑</a></div></div></div></footer>`;
  const lightbox = `<dialog id="lightbox" aria-label="${E(t.ui.enlarge)}"><div class="lightbox-toolbar"><span data-lightbox-counter></span><button class="icon-button" data-lightbox-close aria-label="${E(t.ui.close)}">${icon("close")}</button></div><div class="lightbox-body"><button class="icon-button lightbox-prev" data-lightbox-prev aria-label="${E(t.ui.previous)}">${arrow}</button><img data-lightbox-image alt=""><button class="icon-button lightbox-next" data-lightbox-next aria-label="${E(t.ui.next)}">${arrow}</button></div><p class="lightbox-caption" data-lightbox-caption></p><p class="sr-only" data-lightbox-status aria-live="polite"></p></dialog>`;
  const hero = (item, data, { home = false, facts = [] } = {}) =>
    `<section class="hero ${home ? "home-hero" : "page-hero"}" aria-labelledby="hero-title"><div class="hero-image">${photo(item, { eager: true, sizes: home ? "(max-width: 650px) 1900px, 100vw" : "(max-width: 650px) 1000px, 100vw", alt: item.alt[lang] })}</div><div class="hero-shade"></div><div class="hero-content container">${label(data.eyebrow)}${heading(data.title, "h1", "hero-title")}<p class="hero-description">${E(data.description)}</p><div class="hero-buttons">${button(home ? "#aventures" : "#details", home ? t.home.cta : t.ui.discover)}${button(url("contact"), t.ui.contact, "outline")}</div></div>${home ? `<div class="hero-bottom container"><p>${E(t.home.subtitle)}</p><a class="scroll-link" href="#aventures">${E(t.ui.scroll)}<span aria-hidden="true">↓</span></a><div class="hero-activity-nav">${["buggy", "quad"].map((id) => `<a href="${url(id)}" data-hero-scene="${E(photos[id].src)}" data-scene-srcset="${E(photos[id].srcset)}">${E(t.nav[id])}${arrow}</a>`).join("")}</div></div>` : ""}</section>${facts.length ? `<div class="facts-strip"><div class="container">${facts.map((fact, index) => `<p>${icon(index === 0 ? "pin" : index === 1 ? "check" : "sun")}<span>${E(fact)}</span></p>`).join("")}</div></div>` : ""}`;
  const activityCards = () =>
    `<div class="activity-grid">${["buggy", "quad"].map((id, index) => `<article class="activity-card" data-reveal><a class="activity-photo" href="${url(id)}" tabindex="-1" aria-hidden="true">${photo(photos[id], { sizes: "(max-width: 1200px) 1000px, 60vw" })}<span class="activity-number">0${index + 1}</span></a><div class="activity-content"><div><p class="eyebrow">${E(t.activities[`${id}Tag`])}</p>${heading(t.activities[id], "h3")}<p>${E(t.activities[`${id}Text`])}</p><p class="activity-info">${E(t.activities[`${id}Info`])}</p></div><div class="activity-bottom"><p class="activity-price"><span>${E(t.ui.from)}</span><strong>${id === "buggy" ? 180 : 140} €</strong></p>${button(url(id), t.activities[`${id}Cta`], "dark")}</div></div></article>`).join("")}</div>`;
  const sunsetSection = () =>
    `<section class="sunset-section"><div class="sunset-image">${photo(photos.sunset, { sizes: "(max-width: 650px) 1000px, 100vw" })}</div><div class="sunset-shade"></div><div class="container sunset-content" data-reveal>${label(t.sunset.eyebrow)}${heading(t.sunset.title)}<p>${E(t.sunset.description)}</p><p class="sunset-detail">${E(t.sunset.detail)}</p><p class="sunset-departure">${E(t.sunset.departure)}</p>${button(`${url("buggy")}#soir`, t.sunset.cta, "light")}</div></section>`;
  const galleryItems = (items) =>
    items
      .map(
        (item) =>
          `<a class="gallery-item" href="${E(item.src)}" data-gallery-item data-category="${E(item.category)}" data-caption="${E(item.alt[lang])}" aria-label="${E(`${t.ui.enlarge} : ${item.alt[lang]}`)}">${photo(item, { sizes: "(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" })}<span class="gallery-enlarge" aria-hidden="true">↗</span></a>`,
      )
      .join("");
  const reviews = () => {
    const formatDate = (date) =>
      new Intl.DateTimeFormat(lang, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`));
    return `<section class="reviews-section section" aria-labelledby="reviews-title"><div class="container"><div class="reviews-panel" data-reviews><div class="reviews-intro"><div>${label(t.reviews.eyebrow)}<h2 class="display" id="reviews-title" data-reveal>${lines(t.reviews.title)}</h2></div><div class="reviews-intro-copy"><p>${E(t.reviews.text)}</p><p class="review-selection-note">${E(t.reviews.selection)}</p>${googleSummary ? `<p class="google-summary"><strong>${E(new Intl.NumberFormat(lang).format(Number(googleSummary.rating)))}/5</strong>${googleSummary.count !== null ? ` · ${E(googleSummary.count)} ${E(t.reviews.countLabel)}` : ""} · Google</p>` : ""}${button(googleUrl, t.reviews.cta, "light", true)}</div></div><div class="reviews-toolbar"><span class="google-word" role="img" aria-label="Google"><span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></span><div class="reviews-arrows" hidden><button class="icon-button" data-review-prev aria-label="${E(t.reviews.previous)}">${arrow}</button><button class="icon-button" data-review-next aria-label="${E(t.reviews.next)}">${arrow}</button></div></div><div class="reviews-track" id="review-cards">${[
      ...reviewSelection,
    ]
      .sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date),
      )
      .map(
        (review) =>
          `<article class="google-review-card"><div class="review-card-top"><span class="review-avatar" aria-hidden="true">${E(review.author.charAt(0))}</span><span class="review-google-label">Google</span></div><div class="review-author"><div><h3>${E(review.author)}</h3><time datetime="${E(review.date)}">${E(formatDate(review.date))}</time></div></div>${review.rating ? `<p class="review-stars"><span aria-hidden="true">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span><span class="sr-only">${review.rating}/5</span></p>` : ""}<blockquote>« ${E(review.excerpt[lang])} »</blockquote><p class="review-provenance">${E(review.syndicated ? t.reviews.provenance : t.reviews.directProvenance)}${lang !== "fr" ? ` · ${E(t.reviews.translation)}` : ""}</p>${external(review.source, t.reviews.source)}</article>`,
      )
      .join("")}</div></div></div></section>`;
  };
  const faq = (items = t.faq.items) =>
    `<section class="faq-section section"><div class="container faq-layout">${headingBlock(t.faq.eyebrow, t.faq.title, t.faq.description)}<div class="faq-list" data-reveal>${items.map((item, i) => `<details class="faq-item"><summary><span>${E(item.q)}</span><span class="faq-plus" aria-hidden="true">+</span></summary><div><p>${E(item.a)}</p></div></details>`).join("")}</div></div></section>`;
  const contactBanner = () =>
    `<section class="contact-banner"><div class="container"><div>${label(t.contact.eyebrow)}${heading(t.contact.title)}<p>${E(t.contact.description)}</p></div><div class="contact-banner-actions">${button("tel:+33495703620", `${t.ui.call} · 04 95 70 36 20`, "light")}${button(url("contact"), t.ui.contact, "outline")}</div></div></section>`;
  const conditions = (data) =>
    `<section class="conditions section"><div class="container">${headingBlock(data.conditionsLabel, data.conditionsTitle)}<div class="conditions-grid">${data.conditions.map((item, i) => `<article data-reveal><span class="condition-index">0${i + 1}</span><h3>${E(item.title)}</h3><p>${E(item.text)}</p>${item.items ? `<ul class="packing-list">${item.items.map((tip) => `<li>${E(tip)}</li>`).join("")}</ul>` : ""}</article>`).join("")}</div><div class="document-links">${page === "buggy" ? external(docs.charter, data.charter) : `${external(docs.contract, data.contract)}${external(docs.terms, data.terms)}`}</div></div></section>`;
  const pricesBuggy = [
    [180, 200, 210, 220],
    [180, 200, 210, 220],
    [260, 270, 280, 290],
  ];
  const buggyOffers = () =>
    `<section class="section offers-section" id="details"><div class="container">${headingBlock(t.buggy.label, t.buggy.sectionTitle)}<div class="buggy-offers">${t.buggy.offers.map((offer, i) => `<article class="offer-row"${i === 2 ? ' id="soir"' : ""} data-reveal><div class="offer-image" aria-hidden="true">${photo(offerImages[i], { alt: "", sizes: "(max-width: 650px) 1000px, 100vw" })}</div><div class="offer-heading"><span class="offer-number">0${i + 1}</span><div><p class="eyebrow">${E(offer.duration)}</p>${heading(offer.name, "h3")}<p>${E(offer.description)}</p><p class="offer-time">${E(offer.time)}</p></div></div><div class="offer-prices"><table><caption class="sr-only">${E(`${offer.name} · ${t.ui.perVehicle}`)}</caption><thead><tr>${[2, 3, 4, 5].map((n) => `<th scope="col">${n} ${E(t.ui.people)}</th>`).join("")}</tr></thead><tbody><tr>${pricesBuggy[i].map((price) => `<td>${price} €</td>`).join("")}</tr></tbody></table>${button(url("contact"), t.nav.book, "dark")}</div></article>`).join("")}</div><p class="pricing-note">${E(t.buggy.priceNote)}</p><p class="pricing-note">${E(t.buggy.tastingNote)}</p></div></section>`;
  const housesPreview = () =>
    `<section class="section houses-preview"><div class="container editorial-grid"><div class="editorial-image" data-reveal>${photo(photos.lavezzi)}<span class="image-caption">Villa Lavezzi · Bonifacio</span></div><div class="editorial-copy" data-reveal>${label(t.home.housesLabel)}${heading(t.home.housesTitle)}<p>${E(t.home.housesText)}</p><div class="villa-mini-features"><span>${icon("sun")}${E(t.houses.villas[0].features[1])}</span><span>${icon("pin")}Bonifacio</span></div>${button(url("houses"), t.home.housesCta, "dark")}</div></div></section>`;
  const villaSection = (villa, index) => {
    const key = index ? "cavallo" : "lavezzi";
    return `<section class="section villa-section" id="${key}"><div class="container"><div class="editorial-grid ${index ? "reverse" : ""}"><div class="editorial-image" data-reveal>${photo(photos[key])}<span class="image-caption">${E(villa.name)} · Bonifacio</span></div><div class="editorial-copy" data-reveal>${label(`0${index + 1} · Bonifacio`)}${heading(villa.name)}<p>${E(villa.description)}</p><div class="villa-features">${villa.features.map((feature) => `<span>${E(feature)}</span>`).join("")}</div><ul class="equipment-list">${villa.equipment.map((item) => `<li>${icon("check")}${E(item)}</li>`).join("")}</ul><p class="small-text">${E(t.houses.location)}</p>${button(`${url("contact")}#reservation`, t.ui.enquire, "dark")}<p class="small-text">${E(t.houses.priceNote)}</p></div></div><div class="villa-gallery" data-gallery data-count-template="${E(t.ui.photoCount)}">${galleryItems(villaPhotos[key])}</div></div></section>`;
  };
  const marquee = () =>
    `<div class="motion-marquee" aria-hidden="true"><div class="motion-marquee-track">${[0, 1].map(() => `<div class="motion-marquee-group"><span class="marquee-outline">${E(t.footer.tagline)}</span><span class="marquee-symbol">✳</span><span class="marquee-solid">${E(t.region.south)}</span><span class="marquee-symbol">✳</span></div>`).join("")}</div></div>`;
  const offerImages = [
    gallery.find((item) => item.id === "buggy-foret") || photos.buggy,
    photos.raids || photos.buggy,
    photos.sunset,
  ];
  const content = {
    home: () =>
      `${hero(photos.hero, t.home, { home: true })}<div class="experience-strip motion-drift"><div class="motion-drift-track">${[false, true].map((duplicate) => `<div class="motion-drift-group"${duplicate ? ' aria-hidden="true"' : ""}>${t.home.strip.map((item) => `<span>${E(item)}</span>`).join('<span class="strip-star" aria-hidden="true">✳</span>')}<span class="strip-star" aria-hidden="true">✳</span></div>`).join("")}</div></div><section class="section intro-section"><div class="container editorial-grid"><div class="editorial-copy" data-reveal>${label(t.home.introLabel)}${heading(t.home.introTitle)}<p>${E(t.home.introText)}</p><a class="text-link" href="${url("about")}">${E(t.home.introLink)}${arrow}</a></div><div class="intro-images" data-reveal><div class="intro-main">${photo(photos.introMain || photos.landscape)}</div><div class="intro-small">${photo(photos.introSmall || photos.quad)}</div><div class="location-stamp">${icon("pin")}<span>Bonifacio<br><strong>${E(t.region.south)}</strong></span></div></div></div></section><section class="section activities-section" id="aventures"><div class="container">${headingBlock(t.home.activitiesLabel, t.home.activitiesTitle, t.home.activitiesText)}${activityCards()}</div></section>${sunsetSection()}${housesPreview()}<section class="section home-gallery"><div class="container"><div class="split-heading">${headingBlock(t.home.galleryLabel, t.home.galleryTitle)}<a class="text-link" href="${url("gallery")}">${E(t.home.galleryCta)}${arrow}</a></div><div class="gallery-preview" data-gallery>${galleryItems([photos.buggy, photos.bergerie, photos.landscape, photos.quad])}</div></div></section>${reviews()}${faq(t.faq.items.slice(0, 6))}${contactBanner()}`,
    buggy: () =>
      `${hero(photos.buggy, t.buggy, { facts: t.buggy.facts })}${buggyOffers()}${sunsetSection()}${conditions(t.buggy)}${faq(t.faq.items.filter((_, i) => [0, 1, 3, 4, 6, 8].includes(i)))}<section class="related-section container"><p>${E(t.buggy.related)}</p>${button(url("quad"), t.activities.quadCta, "dark")}</section>${contactBanner()}`,
    quad: () =>
      `${hero(photos.quadHero || photos.quad, t.quad, { facts: t.quad.facts })}<section class="section" id="details"><div class="container">${headingBlock(t.quad.processLabel, t.quad.processTitle)}<ol class="process-steps">${t.quad.steps.map((step, i) => `<li data-reveal><span class="process-number">0${i + 1}</span><h3>${E(step.title)}</h3><p>${E(step.text)}</p></li>`).join("")}</ol></div></section><section class="section quad-offers-section"><div class="container">${headingBlock(t.quad.label, t.quad.sectionTitle)}<div class="quad-offers">${t.quad.offers
        .map(
          (offer, i) =>
            `<article class="quad-offer" data-reveal><p class="eyebrow">${E(offer.name)}</p>${heading(offer.duration, "h3")}<p>${E(offer.description)}</p>${
              i
                ? `<p class="quad-price">230<span> €</span></p><p class="small-text">${E(offer.time)} · ${E(t.ui.perVehicle)}</p>`
                : `<div class="quad-price-options">${[
                    [140, 1],
                    [150, 2],
                  ]
                    .map(
                      ([price, count]) =>
                        `<div><p class="quad-price">${price}<span> €</span></p><p>${count} ${E(count === 1 ? t.ui.person : t.ui.people)}</p></div>`,
                    )
                    .join(
                      "",
                    )}</div><p class="small-text">${E(t.ui.perVehicle)}</p>`
            }${button(url("contact"), t.nav.book, "dark")}</article>`,
        )
        .join(
          "",
        )}</div><div class="included-row"><strong>${E(t.ui.included)}</strong>${t.quad.included.map((item) => `<span>${icon("check")}${E(item)}</span>`).join("")}</div></div></section>${conditions(t.quad)}${faq(t.faq.items.filter((_, i) => [0, 1, 2, 3, 4, 5].includes(i)))}<section class="related-section container"><p>${E(t.quad.related)}</p>${button(url("buggy"), t.activities.buggyCta, "dark")}</section>${contactBanner()}`,
    houses: () =>
      `${hero(photos.cavallo, t.houses)}<div id="details">${t.houses.villas.map(villaSection).join("")}</div>${contactBanner()}`,
    about: () =>
      `${hero(photos.story, t.about)}<section class="section about-story" id="details"><div class="container editorial-grid"><div class="editorial-copy" data-reveal>${label(t.about.label)}${heading(t.about.sectionTitle)}${t.about.paragraphs.map((p) => `<p>${E(p)}</p>`).join("")}</div><div class="editorial-image" data-reveal>${photo(photos.bergerie)}<span class="image-caption">Corsica Ranger · Bonifacio</span></div></div></section><section class="section timeline-section"><div class="container"><div class="timeline">${t.about.timeline.map((item) => `<article data-reveal><p class="timeline-year">${E(item.year)}</p><h2>${E(item.title)}</h2><p>${E(item.text)}</p></article>`).join("")}</div>${heading(t.about.closing, "p", "about-closing")}</div></section>${contactBanner()}`,
    gallery: () =>
      `${hero(photos.sunset, t.gallery)}<section class="section gallery-section" id="details"><div class="container" data-gallery data-count-template="${E(t.ui.photoCount)}"><div class="gallery-controls"><div class="gallery-filters" role="group" aria-label="${E(t.nav.gallery)}">${Object.entries(
        t.gallery.categories,
      )
        .map(
          ([key, text]) =>
            `<button class="filter ${key === "all" ? "active" : ""}" data-filter="${key}" aria-pressed="${key === "all"}">${E(text)}</button>`,
        )
        .join(
          "",
        )}</div><p class="small-text" aria-live="polite" data-gallery-count>${E(t.ui.photoCount.replace("{n}", gallery.length))}</p></div><div class="gallery-grid">${galleryItems(gallery)}</div></div></section><section class="social-section container">${headingBlock(t.gallery.socialText, t.gallery.social)}<div class="social-links">${Object.entries(
        socialUrls,
      )
        .map(([name, href]) => external(href, name))
        .join("")}</div></section>${contactBanner()}`,
    contact: () =>
      `${hero(photos.landscape, t.contact)}<section class="section reservation-section" id="details"><div class="container" id="reservation">${headingBlock(t.contact.eyebrow, t.contact.bookingTitle, t.contact.bookingText)}<div class="reservation-grid"><article class="contact-method" data-reveal>${icon("phone")}<p class="eyebrow">${E(t.contact.callLabel)}</p><a class="primary-phone" href="tel:+33495703620">04 95 70 36 20${arrow}</a><a class="secondary-phone" href="tel:+33680437013">06 80 43 70 13${arrow}</a><p>${E(t.contact.reservationTip)}</p></article><article class="contact-method" data-reveal>${icon("mail")}<p class="eyebrow">${E(t.contact.emailLabel)}</p><a class="primary-email" href="mailto:corsicaranger2a@gmail.com?subject=${encodeURIComponent(t.contact.emailSubject)}">corsicaranger2a@gmail.com${arrow}</a><p>${E(t.contact.emailText)}</p>${button(`mailto:corsicaranger2a@gmail.com?subject=${encodeURIComponent(t.contact.emailSubject)}`, t.ui.email, "dark")}</article></div></div></section><section class="section location-section"><div class="container editorial-grid"><div class="editorial-copy" data-reveal>${label(t.contact.addressLabel)}${heading(t.contact.addressTitle)}<address>${lines(t.contact.address)}</address><p>${E(t.contact.allYear)}</p><p class="small-text">${E(t.contact.gps)} : 41.419526, 9.185308</p>${button("https://www.google.com/maps/dir/?api=1&destination=41.419526,9.185308", t.contact.directions, "dark", true)}</div><div class="map-placeholder" data-map-container><div class="map-lines" aria-hidden="true"></div><div class="map-pin">${icon("pin")}<strong>Corsica Ranger</strong><span>Bonifacio</span></div><div class="map-load"><button class="button dark" data-map-load data-map-src="https://maps.google.com/maps?q=41.419526,9.185308&z=13&output=embed" data-map-title="${E(t.contact.mapTitle)}">${E(t.contact.loadMap)}${arrow}</button><p>${E(t.contact.mapNote)}</p></div></div></div></section>${faq()}`,
    legal: () =>
      `<section class="legal-page section container">${label(t.legal.eyebrow)}${heading(t.legal.title, "h1")}<div class="legal-content"><h2>${E(t.legal.publisher)}</h2><p>SARL Belle Île / Corsica Ranger<br>Route de Canetto, Peroxi, 20169 Bonifacio, ${E(t.region.island)}<br>SIRET : 504 423 591 00016</p><p><a href="tel:+33495703620">04 95 70 36 20</a> · <a href="tel:+33680437013">06 80 43 70 13</a><br><a href="mailto:corsicaranger2a@gmail.com">corsicaranger2a@gmail.com</a></p><h2>${E(t.legal.director)}</h2><p>Marlène Boitel</p><h2>${E(t.legal.host)}</h2><p>${E(t.legal.hostText)}</p><h2>${E(t.legal.credits)}</h2><p>${E(t.legal.creditsText)}</p><h2>${E(t.legal.commercial)}</h2><p>${E(t.legal.commercialText)}</p><h2>${E(t.legal.sources)}</h2><div class="document-links">${external(docs.charter, t.buggy.charter)}${external(docs.contract, t.quad.contract)}${external(docs.terms, t.quad.terms)}${external("https://corsicaranger.com/mentions-legales", t.legal.original)}</div></div></section>`,
    privacy: () =>
      `<section class="legal-page section container">${label(t.privacy.eyebrow)}${heading(t.privacy.title, "h1")}<div class="legal-content">${t.privacy.sections.map((section) => `<h2>${E(section.title)}</h2><p>${E(section.text)}</p>`).join("")}</div></section>`,
    notFound: () =>
      `<section class="not-found section container"><p class="eyebrow">404</p>${heading(t.notFound.title, "h1")}<p>${E(t.notFound.description)}</p>${button(url("home"), t.ui.backHome, "dark")}</section>`,
  }[page]();
  const meta = t.seo[page];
  const canonical = absoluteUrl(pathFor(page, lang));
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: "Corsica Ranger",
    legalName: "SARL Belle Île",
    url: siteUrl,
    image: absoluteUrl(assets.photos.hero.src),
    logo: `${siteUrl}/assets/logo.png`,
    telephone: "+33495703620",
    email: "corsicaranger2a@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Route de Canetto, Peroxi",
      postalCode: "20169",
      addressLocality: "Bonifacio",
      addressRegion: "Corse",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.419526,
      longitude: 9.185308,
    },
    sameAs: Object.values(socialUrls),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t.nav.home,
        item: absoluteUrl(pathFor("home", lang)),
      },
      ...(page !== "home"
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: t.nav[page] || meta.title.split(" — ")[0],
              item: canonical,
            },
          ]
        : []),
    ],
  };
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="site-base-path" content="${E(basePath)}"><title>${E(meta.title)}</title><meta name="description" content="${E(meta.description)}"><meta name="theme-color" content="#20352e"><meta name="robots" content="${page === "notFound" ? "noindex,follow" : "index,follow"}"><link rel="canonical" href="${E(canonical)}">${languages.map((code) => `<link rel="alternate" hreflang="${code}" href="${E(`${siteUrl}${pathFor(page, code)}`)}">`).join("")}<link rel="alternate" hreflang="x-default" href="${E(`${siteUrl}${pathFor(page, "fr")}`)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Corsica Ranger"><meta property="og:locale" content="${E(t.locale)}"><meta property="og:title" content="${E(meta.title)}"><meta property="og:description" content="${E(meta.description)}"><meta property="og:url" content="${E(canonical)}"><meta property="og:image" content="${siteUrl}/assets/social.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${publicPath("/assets/favicon.png")}" type="image/png"><link rel="preload" href="${publicPath("/assets/fonts/barlow-condensed-latin.woff2")}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${publicPath("/assets/styles.css")}"><link rel="stylesheet" href="${publicPath("/assets/effects.css")}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script><script type="application/ld+json">${JSON.stringify(breadcrumb).replace(/</g, "\\u003c")}</script><script src="${publicPath("/assets/motion.js")}" defer></script><script src="${publicPath("/assets/client.js")}" defer></script></head><body id="top" class="page-${page}">${header}<noscript><nav class="no-script-nav" aria-label="${E(t.nav.home)}">${navLinks()}${languageLinks()}</nav></noscript><main id="main">${content}</main>${["home", "buggy", "quad", "houses", "about", "gallery", "contact"].includes(page) ? marquee() : ""}${footer}${lightbox}</body></html>`;
}
