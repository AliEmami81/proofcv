(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProofCV = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const aliases = {
    JavaScript: ['javascript', 'js'], TypeScript: ['typescript', 'ts'], Python: ['python'], 'C++': ['c++', 'cpp'], 'C#': ['c#', 'csharp'], Java: ['java'], Go: ['golang'], Rust: ['rust'], React: ['react', 'reactjs', 'react.js'], Vue: ['vue', 'vuejs'], Angular: ['angular'], 'Node.js': ['node.js', 'nodejs'], HTML: ['html'], CSS: ['css'], SQL: ['sql'], PostgreSQL: ['postgresql', 'postgres'], MySQL: ['mysql'], MongoDB: ['mongodb'], Redis: ['redis'], Docker: ['docker'], Kubernetes: ['kubernetes', 'k8s'], AWS: ['aws', 'amazon web services'], Azure: ['azure'], Git: ['git'], Linux: ['linux'], REST: ['rest', 'restful'], GraphQL: ['graphql'], Testing: ['testing', 'tests', 'unit test', 'unit tests'], Playwright: ['playwright'], Jest: ['jest'], 'CI/CD': ['ci/cd', 'continuous integration', 'continuous delivery'], 'Machine learning': ['machine learning'], 'Data analysis': ['data analysis', 'data analytics'], Excel: ['excel'], Tableau: ['tableau'], 'Power BI': ['power bi'], Figma: ['figma'], Accessibility: ['accessibility', 'wcag'], 'Project management': ['project management'], Agile: ['agile'], Scrum: ['scrum'], Leadership: ['leadership'], Mentoring: ['mentoring', 'mentored'], Communication: ['communication'], 'Customer service': ['customer service', 'customer support'], Sales: ['sales'], CRM: ['crm'], Salesforce: ['salesforce'], Budgeting: ['budgeting', 'budget management'], 'Content writing': ['content writing', 'copywriting'], SEO: ['seo', 'search engine optimization'], 'Product management': ['product management'], 'User research': ['user research'], 'UX design': ['ux design', 'user experience design']
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Profile must be a JSON object.');
    if (JSON.stringify(input).length > 250000) throw Error('Profile exceeds 250,000 characters.');
    if (!input.basics || typeof input.basics !== 'object' || Array.isArray(input.basics)) throw Error('Profile needs a basics object.');
    const string = (v, name) => { if (v !== undefined && (typeof v !== 'string' || v.length > 12000)) throw Error(name + ' must be a string of at most 12,000 characters.'); };
    for (const key of ['name', 'label', 'email', 'phone', 'url', 'summary']) string(input.basics[key], 'basics.' + key);
    if (input.basics.location !== undefined) {
      if (!input.basics.location || typeof input.basics.location !== 'object' || Array.isArray(input.basics.location)) throw Error('basics.location must be an object.');
      for (const key of ['city', 'region', 'countryCode']) string(input.basics.location[key], 'location.' + key);
    }
    const sections = { work: ['name', 'position', 'startDate', 'endDate', 'summary', 'url'], projects: ['name', 'description', 'url', 'startDate', 'endDate'], education: ['institution', 'studyType', 'area', 'startDate', 'endDate'], skills: ['name', 'level'] };
    for (const [key, fields] of Object.entries(sections)) {
      if (input[key] === undefined) continue;
      if (!Array.isArray(input[key]) || input[key].length > 50) throw Error(key + ' must be an array with at most 50 entries.');
      for (const item of input[key]) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error(key + ' entries must be objects.');
        for (const field of fields) string(item[field], key + '.' + field);
        for (const field of ['highlights', 'keywords']) if (item[field] !== undefined) {
          if (!Array.isArray(item[field]) || item[field].length > 100 || item[field].some(v => typeof v !== 'string' || v.length > 12000)) throw Error(field + ' must be an array of at most 100 strings.');
        }
      }
    }
    return clone(input);
  }
  function contains(text, alias) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^\\p{L}\\p{N}_])' + escaped + '(?=$|[^\\p{L}\\p{N}_])', 'iu').test(text);
  }
  function sources(profile) {
    const list = [];
    const add = (path, text) => { if (text) list.push({ path, text }); };
    add('basics.summary', profile.basics.summary);
    for (const section of ['work', 'projects', 'education', 'skills']) (profile[section] || []).forEach((item, i) => {
      const fields = section === 'work' ? ['position', 'summary'] : section === 'projects' ? ['name', 'description'] : section === 'education' ? ['studyType', 'area'] : ['name'];
      for (const field of fields) add(`${section}[${i}].${field}`, item[field]);
      for (const field of ['highlights', 'keywords']) (item[field] || []).forEach((text, j) => add(`${section}[${i}].${field}[${j}]`, text));
    });
    return list;
  }
  function terms(text) { return Object.keys(aliases).filter(term => aliases[term].some(alias => contains(text, alias))); }
  function analyze(profile, job, excluded = []) {
    if (typeof job !== 'string' || job.length > 30000) throw Error('Job text must be at most 30,000 characters.');
    const ignored = new Set(excluded);
    const evidence = sources(profile).filter(source => !ignored.has(source.path));
    const requirements = terms(job).map(term => ({ term, sources: evidence.filter(source => aliases[term].some(alias => contains(source.text, alias))) }));
    const matched = requirements.filter(r => r.sources.length).length;
    return { requirements, matched, total: requirements.length, coverage: requirements.length ? Math.round(100 * matched / requirements.length) : null };
  }
  function bulletKey(section, i, j) { return `${section}[${i}].highlights[${j}]`; }
  function rankedBullets(profile, job, excluded = []) {
    const wanted = terms(job), ignored = new Set(excluded);
    const list = [];
    for (const section of ['work', 'projects']) (profile[section] || []).forEach((entry, i) => (entry.highlights || []).forEach((text, j) => {
      const source = bulletKey(section, i, j);
      list.push({ source, section, index: i, text, included: !ignored.has(source), matches: wanted.filter(term => aliases[term].some(alias => contains(text, alias))) });
    }));
    return list;
  }
  function safeUrl(url) { try { const value = new URL(url); return ['https:', 'http:'].includes(value.protocol) ? value.href : null; } catch { return null; } }
  function resumeMarkup(profile, options = {}) {
    const { job = '', excluded = [], focus = false } = options;
    const b = profile.basics, bullets = rankedBullets(profile, job, excluded);
    const paragraphs = text => text ? `<p>${escape(text)}</p>` : '';
    const link = (url, label) => safeUrl(url) ? `<a href="${escape(safeUrl(url))}" rel="noreferrer">${escape(label || url)}</a>` : escape(label || url || '');
    const date = item => [item.startDate, item.endDate || (item.startDate ? 'Present' : '')].filter(Boolean).join(' – ');
    const highlights = (section, i) => {
      const selected = bullets.filter(x => x.section === section && x.index === i && x.included);
      if (focus) selected.sort((a, b) => b.matches.length - a.matches.length);
      return selected.length ? '<ul>' + selected.map(x => `<li data-source="${escape(x.source)}" tabindex="0">${escape(x.text)}</li>`).join('') + '</ul>' : '';
    };
    const section = (title, html) => html ? `<section><h2>${title}</h2>${html}</section>` : '';
    const work = (profile.work || []).map((item, i) => `<div class="entry"><div class="entry-heading"><h3>${escape(item.position || 'Role')}${item.name ? ' · ' + escape(item.name) : ''}</h3><span>${escape(date(item))}</span></div>${paragraphs(item.summary)}${highlights('work', i)}</div>`).join('');
    const projects = (profile.projects || []).map((item, i) => `<div class="entry"><h3>${link(item.url, item.name || 'Project')}</h3>${paragraphs(item.description)}${highlights('projects', i)}</div>`).join('');
    const education = (profile.education || []).map(item => `<div class="entry"><div class="entry-heading"><h3>${escape(item.institution || '')}</h3><span>${escape(date(item))}</span></div>${paragraphs([item.studyType, item.area].filter(Boolean).join(' · '))}</div>`).join('');
    const skills = (profile.skills || []).map(item => `<p><strong>${escape(item.name || 'Skills')}</strong>${item.keywords?.length ? ': ' + item.keywords.map(escape).join(', ') : ''}</p>`).join('');
    const contact = [b.email, b.phone, [b.location?.city, b.location?.region, b.location?.countryCode].filter(Boolean).join(', ')].filter(Boolean).map(escape);
    if (b.url) contact.push(link(b.url));
    return `<article class="resume" dir="auto"><h1>${escape(b.name || 'Your name')}</h1><p class="role">${escape(b.label || '')}</p><p class="contact">${contact.join(' · ')}</p>${section('Profile', paragraphs(b.summary))}${section('Experience', work)}${section('Projects', projects)}${section('Education', education)}${section('Skills', skills)}</article>`;
  }
  const printCss = `*{box-sizing:border-box}body{margin:0;color:#17212a;background:white;font:10.5pt/1.5 Arial,"Segoe UI",sans-serif}.resume{max-width:190mm;margin:0 auto;padding:12mm}.resume h1{font-size:26pt;line-height:1.15;margin:0 0 5px}.resume .role{font-size:12pt;margin:0 0 8px;color:#40546a}.resume .contact{font-size:9pt;color:#485767;overflow-wrap:anywhere}.resume h2{font-size:10pt;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ccd3db;padding-bottom:5px;margin:19px 0 9px}.resume h3{font-size:10.5pt;margin:0}.resume p{margin:5px 0}.resume .entry{margin:11px 0}.resume .entry-heading{display:flex;justify-content:space-between;align-items:baseline;gap:15px}.entry-heading span{font-size:8.5pt;color:#5a6570;white-space:nowrap}.resume ul{margin:6px 0;padding-inline-start:19px}.resume li{margin:4px 0;overflow-wrap:anywhere}.resume a{color:inherit;text-decoration:none}.resume h2,.resume h3{break-after:avoid}.resume li{break-inside:avoid}@page{size:A4;margin:12mm}@media print{.resume{max-width:none;padding:0}body{print-color-adjust:exact}}`;
  function exportHtml(profile, options) { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(profile.basics.name || 'Resume')} — Resume</title><style>${printCss}</style></head><body>${resumeMarkup(profile, options)}</body></html>`; }
  return { validate, terms, analyze, sources, rankedBullets, resumeMarkup, exportHtml, printCss, safeUrl };
});
