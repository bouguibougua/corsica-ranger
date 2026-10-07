export const languages = ["fr", "en", "it"];
export const pages = [
  "home",
  "buggy",
  "quad",
  "houses",
  "about",
  "gallery",
  "contact",
  "legal",
  "privacy",
];
const slugs = {
  fr: {
    home: "",
    buggy: "buggy",
    quad: "quad",
    houses: "maisons",
    about: "a-propos",
    gallery: "galerie",
    contact: "contact",
    legal: "mentions-legales",
    privacy: "confidentialite",
    notFound: "404",
  },
  en: {
    home: "",
    buggy: "buggy",
    quad: "quad",
    houses: "villas",
    about: "about",
    gallery: "gallery",
    contact: "contact",
    legal: "legal-notice",
    privacy: "privacy",
    notFound: "404",
  },
  it: {
    home: "",
    buggy: "buggy",
    quad: "quad",
    houses: "ville",
    about: "chi-siamo",
    gallery: "galleria",
    contact: "contatti",
    legal: "note-legali",
    privacy: "privacy",
    notFound: "404",
  },
};
export function pathFor(page, lang = "fr") {
  const parts = [lang === "fr" ? "" : lang, slugs[lang][page]].filter(Boolean);
  return parts.length ? `/${parts.join("/")}/` : "/";
}
