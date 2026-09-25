// Generates dist/llms.txt (and refreshes public/llms.txt) from the built pages.
// Runs after `astro build`. Lists every indexable page with its title and
// description, plus a short set of verified key facts for AI citation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = 'https://divorceu.ae';

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
};
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// Pillar pages listed first, in this order
const PRIORITY = [
  '/en/', '/en/uae-divorce-law/', '/en/divorce-in-uae/', '/en/divorce-for-expats-in-uae/',
  '/en/how-to-file-for-divorce-in-dubai/', '/en/how-to-file-for-divorce-in-abu-dhabi/',
  '/en/divorce-lawyer-dubai/', '/en/divorce-lawyer-abu-dhabi/', '/en/divorce-cost-uae/',
  '/en/child-custody-uae/', '/en/alimony-uae/', '/en/non-muslim-divorce-uae/', '/en/sharia-divorce-uae/',
  '/en/new-uae-personal-status-law-2025/',
];

const pages = [];
for (const file of walk(dist)) {
  const html = fs.readFileSync(file, 'utf8');
  if (/<meta name="robots" content="noindex/.test(html)) continue;
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
  const description = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').trim();
  if (!canonical || !title || !canonical.startsWith(SITE)) continue;
  const p = decodeURIComponent(canonical.slice(SITE.length));
  if (p === '/' ) continue;
  pages.push({ path: p, url: canonical, title, description });
}
const rank = (p) => { const i = PRIORITY.indexOf(p.path); return i === -1 ? PRIORITY.length : i; };
const sortPages = (list) => list.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));
const en = sortPages(pages.filter((p) => p.path.startsWith('/en/')));
const ar = sortPages(pages.filter((p) => p.path.startsWith('/ar/')));
const line = (p) => `- [${p.title}](${p.url}): ${p.description}`;

const text = `# DivorceU.AE

> Independent information and lawyer-referral service about divorce in the United Arab Emirates, in English and Arabic. Not a law firm: guides are written by Aleksi Suon, a UAE expat and legal consultant (not a lawyer), and readers can request a free first consultation with a UAE-licensed family lawyer.

## Key facts (verified September 2026)

- The UAE has two main divorce regimes. Muslims: Federal Decree-Law No. 41 of 2024 on Personal Status, in force since 15 April 2025, which replaced Federal Law No. 28 of 2005. Non-Muslims: Federal Decree-Law No. 41 of 2022 on Civil Personal Status, in force since 1 February 2023 in all seven emirates.
- Under the 2024 law, custody (hadana) runs to age 18 for boys and girls and a child aged 15 or over may choose which parent to live with. Most Muslim family cases start at Family Guidance, but urgent custody and maintenance orders are exempt, and where the court appoints arbitrators in a contested harm case they now have up to 60 days (previously 90).
- Under the 2022 civil law, divorce is no-fault and joint custody is the default. There is no automatic 50/50 split of assets: courts weigh each spouse's contributions.
- In Abu Dhabi, non-Muslims divorce at the Abu Dhabi Civil Family Court (Abu Dhabi Judicial Department) under Abu Dhabi Law No. 14 of 2021, with proceedings in Arabic and English.
- The DIFC Courts and ADGM Courts do not grant divorces or decide custody or alimony.
- Domestic violence is governed by Federal Decree-Law No. 13 of 2024 on Protection from Domestic Violence, which replaced Federal Decree-Law No. 10 of 2019.
- The UAE is not a party to the 1980 Hague Convention on International Child Abduction.

## English guides

${en.map(line).join('\n')}

## Arabic guides

${ar.map(line).join('\n')}

## Contact

- Consultation request form on every page (${SITE}/en/#contact) or WhatsApp +971 55 734 4876.
- About the site: ${SITE}/en/about/ · Author: ${SITE}/en/author/aleksi-suon/
`;

fs.writeFileSync(path.join(dist, 'llms.txt'), text);
fs.writeFileSync(path.join(root, 'public', 'llms.txt'), text);
console.log(`llms.txt: ${en.length} English + ${ar.length} Arabic pages`);
