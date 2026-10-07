// Routes stay relative to the site root; the public URL supplies its mount path.
export function createSiteConfig(input = "https://corsicaranger.com") {
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("SITE_URL doit être une URL HTTP(S) valide.");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    throw new Error(
      "SITE_URL doit être une URL HTTP(S) sans identifiants, paramètres ni fragment.",
    );

  const origin = parsed.origin;
  const basePath = parsed.pathname.replace(/\/+$/, "");
  const siteUrl = `${origin}${basePath}`;
  function publicPath(path) {
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new Error(`Chemin interne invalide : ${path}`);
    return `${basePath}${path}`;
  }
  return {
    origin,
    basePath,
    siteUrl,
    publicPath,
    absoluteUrl: (path) => `${origin}${publicPath(path)}`,
  };
}
