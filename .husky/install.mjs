// Husky bootstrap — skipped on CI and Vercel where git hooks don't exist.
// (Official husky-recommended pattern for prepare scripts.)
if (process.env.CI !== undefined || process.env.VERCEL !== undefined) {
  process.exit(0);
}
const husky = (await import('husky')).default;
console.log(husky());
