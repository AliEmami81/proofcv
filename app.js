'use strict';
(() => {
  const api = ProofCV, $ = id => document.getElementById(id), key = 'proofcv.workspace.v1';
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  let profile = api.validate(ProofCVSample), section = 'basics', excluded = [], focus = false;
  $('job').value = ProofCVSampleJob;
  function notice(message, isDemo = false) { $('notice').textContent = message; $('demo-label').textContent = isDemo ? 'FICTIONAL DEMO PROFILE' : 'YOUR LOCAL WORKSPACE'; }
  function evidence(title, source) {
    $('evidence-title').textContent = title;
    $('evidence-text').textContent = source?.text || 'This keyword was not found in the supported profile fields. Add it only if you have that experience.';
    $('evidence-path').textContent = source?.path || '';
  }
  function update() {
    const job = $('job').value;
    $('resume-preview').innerHTML = api.resumeMarkup(profile, { job, excluded, focus });
    const result = api.analyze(profile, job, excluded);
    $('coverage').textContent = result.coverage === null ? '—' : result.coverage + '%';
    $('coverage-count').textContent = result.total ? `${result.matched} of ${result.total} terms` : 'No recognized terms';
    $('terms').replaceChildren();
    for (const item of result.requirements) {
      const button = make('button', (item.sources.length ? '✓ ' : '+ ') + item.term, item.sources.length ? '' : 'missing');
      button.addEventListener('click', () => {
        evidence(item.term, item.sources[0]);
        if (item.sources.length > 1) $('evidence-text').textContent += ` (Also appears in ${item.sources.length - 1} other source fields.)`;
      }); $('terms').append(button);
    }
    $('bullet-picks').replaceChildren();
    for (const bullet of api.rankedBullets(profile, job, excluded)) {
      const label = make('label', undefined, 'pick'), input = make('input'); input.type = 'checkbox'; input.checked = bullet.included;
      input.addEventListener('change', () => { excluded = input.checked ? excluded.filter(x => x !== bullet.source) : [...new Set([...excluded, bullet.source])]; update(); });
      label.append(input, make('span', bullet.text)); $('bullet-picks').append(label);
    }
    if (!$('bullet-picks').children.length) $('bullet-picks').append(make('p', 'Add experience or project highlights to select bullets.'));
  }
  function field(label, value, change, multiline = false, hint = '') {
    const wrapper = make('label', undefined, 'field'); wrapper.append(make('span', label));
    const input = make(multiline ? 'textarea' : 'input'); input.value = value || ''; input.dir = 'auto'; input.maxLength = 12000;
    if (multiline) input.rows = 4;
    input.addEventListener('input', () => { change(input.value); notice('Unsaved changes. Export or save on this device to keep them.'); update(); });
    wrapper.append(input); if (hint) wrapper.append(make('span', hint, 'hint')); return wrapper;
  }
  function editor() {
    $('fields').replaceChildren();
    for (const button of document.querySelectorAll('[data-section]')) { button.classList.toggle('active', button.dataset.section === section); button.setAttribute('aria-pressed', String(button.dataset.section === section)); }
    if (section === 'basics') {
      for (const [key, label] of [['name', 'Full name'], ['label', 'Professional title'], ['email', 'Email'], ['phone', 'Phone'], ['url', 'Portfolio URL'], ['summary', 'Summary']]) $('fields').append(field(label, profile.basics[key], value => profile.basics[key] = value, key === 'summary'));
      for (const [key, label] of [['city', 'City'], ['region', 'Region'], ['countryCode', 'Country code']]) $('fields').append(field(label, profile.basics.location?.[key], value => { profile.basics.location ||= {}; profile.basics.location[key] = value; }));
      return;
    }
    if (section === 'skills') {
      (profile.skills || []).forEach((item, i) => {
        const box = make('div', undefined, 'entry-form');
        box.append(titleBar(`Skill group ${i + 1}`, i), field('Group name', item.name, value => item.name = value), field('Keywords, separated by commas', (item.keywords || []).join(', '), value => item.keywords = value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 100), true));
        $('fields').append(box);
      });
    } else {
      const fields = section === 'work' ? [['name', 'Organization'], ['position', 'Role'], ['startDate', 'Start date'], ['endDate', 'End date (blank = Present)'], ['summary', 'Role context'], ['highlights', 'Highlights — one per line']] : section === 'projects' ? [['name', 'Project name'], ['url', 'Project URL'], ['description', 'Description'], ['highlights', 'Highlights — one per line']] : [['institution', 'Institution'], ['studyType', 'Qualification'], ['area', 'Field of study'], ['startDate', 'Start date'], ['endDate', 'End date (blank = Present)']];
      (profile[section] || []).forEach((item, i) => {
        const box = make('div', undefined, 'entry-form'); box.append(titleBar(`${section === 'work' ? 'Role' : section === 'projects' ? 'Project' : 'Education'} ${i + 1}`, i));
        for (const [key, label] of fields) box.append(field(label, key === 'highlights' ? (item[key] || []).join('\n') : item[key], value => { item[key] = key === 'highlights' ? value.split('\n').filter(x => x.trim()).slice(0, 100) : value; if (key === 'highlights') excluded = excluded.filter(x => !x.startsWith(section + '[' + i + '].')); }, ['summary', 'description', 'highlights'].includes(key)));
        $('fields').append(box);
      });
    }
    const add = make('button', '+ Add ' + (section === 'work' ? 'experience' : section === 'skills' ? 'skill group' : section === 'projects' ? 'project' : 'education'));
    add.addEventListener('click', () => {
      profile[section] ||= [];
      if (profile[section].length >= 50) return notice('Each section supports up to 50 entries.');
      profile[section].push({}); editor(); update(); notice('New entry added.');
    }); $('fields').append(add);
  }
  function titleBar(text, i) {
    const h = make('h3', text), button = make('button', 'Remove');
    button.addEventListener('click', () => { profile[section].splice(i, 1); excluded = []; editor(); update(); notice('Entry removed. Export your profile to keep a backup.'); });
    h.append(button); return h;
  }
  function download(text, name, type) {
    const url = URL.createObjectURL(new Blob([text], { type })), a = make('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => { section = button.dataset.section; editor(); }));
  $('job').addEventListener('input', update);
  $('focus').addEventListener('change', () => { focus = $('focus').checked; update(); });
  $('resume-preview').addEventListener('click', event => {
    const source = event.target.closest('[data-source]')?.dataset.source;
    if (source) evidence('Original experience bullet', api.sources(profile).find(x => x.path === source));
  });
  $('resume-preview').addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.dataset.source) event.target.click(); });
  $('print').addEventListener('click', () => window.print());
  $('html').addEventListener('click', () => download(api.exportHtml(profile, { job: $('job').value, excluded, focus }), 'proofcv-resume.html', 'text/html'));
  $('json').addEventListener('click', () => download(JSON.stringify(profile, null, 2), 'proofcv-profile.json', 'application/json'));
  $('import').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', async () => {
    const file = $('file').files[0]; if (!file) return;
    try {
      if (file.size > 250000) throw Error('Choose a JSON file under 250 kB.');
      profile = api.validate(JSON.parse(await file.text())); excluded = []; editor(); update();
      const extra = Object.keys(profile).filter(k => !['basics', 'work', 'projects', 'education', 'skills', '$schema', 'meta'].includes(k));
      notice(extra.length ? `Imported. Other sections (${extra.join(', ')}) are preserved in JSON exports but not displayed.` : 'Profile imported. Nothing was uploaded.');
    } catch (error) { notice('Import failed: ' + (error instanceof SyntaxError ? 'Invalid JSON.' : error.message)); }
    $('file').value = '';
  });
  $('save').addEventListener('click', () => { try { api.validate(profile); localStorage.setItem(key, JSON.stringify({ profile, job: $('job').value, excluded, focus })); notice('Saved in this browser on this device. Anyone using this browser profile may access it.'); } catch { notice('Could not save. Export a profile JSON backup instead.'); } });
  $('restore').addEventListener('click', () => { try {
    const saved = JSON.parse(localStorage.getItem(key)); if (!saved) return notice('No saved workspace in this browser.');
    const checked = api.validate(saved.profile);
    if (typeof saved.job !== 'string' || saved.job.length > 30000 || !Array.isArray(saved.excluded) || saved.excluded.some(x => typeof x !== 'string')) throw Error('Invalid workspace');
    profile = checked; excluded = saved.excluded; focus = Boolean(saved.focus); $('focus').checked = focus; $('job').value = saved.job; editor(); update(); notice('Saved workspace restored.');
  } catch { notice('Saved workspace could not be read. Import a profile JSON backup instead.'); } });
  $('forget').addEventListener('click', () => { try { localStorage.removeItem(key); notice('Saved workspace removed from this browser. The current page is unchanged.'); } catch { notice('Browser storage is unavailable.'); } });
  $('blank').addEventListener('click', () => { if (!confirm('Start a blank profile? Export or save any current work first.')) return; profile = { basics: {}, work: [], projects: [], education: [], skills: [] }; excluded = []; editor(); update(); notice('Blank profile. Start with your contact details.'); });
  $('sample').addEventListener('click', () => { if (!confirm('Load fictional demo data? Export or save any current work first.')) return; profile = api.validate(ProofCVSample); excluded = []; $('job').value = ProofCVSampleJob; editor(); update(); notice('Fictional demo loaded.', true); });
  editor(); update();
})();
