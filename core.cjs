(function (root) {
  'use strict';
  const fields = {
    schools: ['scuole', 'education_score'], roads: ['strade', 'development_score'],
    bases: ['basi_militari', 'military_score'], hospitals: ['ospedali', 'health_score']
  };
  const keys = [...Object.keys(fields), 'scores'];
  function gameURL(value) {
    const u = new URL(value);
    if (u.protocol !== 'https:' || !['diplomacia.com.tr', 'www.diplomacia.com.tr'].includes(u.hostname) || u.port || u.username || u.password || u.hash) throw Error('URL non consentito');
    if ([...u.searchParams.keys()].some(k => /token|password|secret|auth|session|key/i.test(k))) throw Error('Non salvare credenziali negli indirizzi');
    return u;
  }
  function validateEndpoints(endpoints, origin) {
    if (!endpoints || Array.isArray(endpoints) || typeof endpoints !== 'object' || Object.keys(endpoints).length !== keys.length || keys.some(k => typeof endpoints[k] !== 'string' || !endpoints[k])) throw Error('Configura tutti e cinque gli indirizzi');
    const urls = keys.map(k => gameURL(endpoints[k]));
    if (urls.some(u => !u.pathname.startsWith('/api/'))) throw Error('Servono gli indirizzi JSON /api/ osservati nel gioco, non gli indirizzi delle pagine');
    if (urls.some(u => u.origin !== (origin || urls[0].origin))) throw Error('Gli indirizzi devono appartenere alla stessa origine della scheda del gioco');
    return urls[0].origin;
  }
  function classify(value) {
    const u = gameURL(value);
    if (!u.pathname.endsWith('/all') && !u.pathname.includes('world-ranking')) return null;
    const type = (u.searchParams.get('buildingType') || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
    if (!type) return u.pathname.endsWith('/all') ? 'scores' : null;
    if (type.includes('hastane') || type === 'hospital') return 'hospitals';
    if (type.includes('okul') || type === 'school') return 'schools';
    if (type.includes('yol') || type === 'road') return 'roads';
    if (type.includes('asker') || type.includes('us') || type === 'base') return 'bases';
    return null;
  }
  function count(n) { return Number.isSafeInteger(n) && n >= 0; }
  function validateItems(items) {
    if (!Array.isArray(items) || items.length < 100) throw Error('Elenco province incompleto');
    const names = new Set();
    for (const p of items) {
      if (!p || typeof p.name !== 'string' || !p.name.trim() || names.has(p.name)) throw Error('Nomi provincia mancanti o duplicati');
      names.add(p.name);
      for (const [quantity, score] of Object.values(fields)) {
        if (!count(p[quantity])) throw Error('Conteggio non valido: ' + p.name);
        if (!count(p[score]) || p[score] > 11) throw Error('Indice non valido: ' + p.name);
      }
    }
    return items;
  }
  function snapshot(raw, previous, date = new Date()) {
    if (!raw || !Array.isArray(raw.scores?.provinces)) throw Error('Indici provinciali mancanti');
    const old = new Map(previous.map(p => [p.name, p]));
    const names = new Set();
    const items = raw.scores.provinces.map(p => {
      if (!p || typeof p.name !== 'string' || !p.name.trim() || names.has(p.name)) throw Error('Indici con nomi mancanti o duplicati');
      names.add(p.name);
      // Keep only province metadata; never persist full arbitrary response objects.
      const result = {...(old.get(p.name) || {}), name: p.name};
      for (const key of ['country_name','region','icon','country_id','is_capital','is_independent','player_count']) if (p[key] !== undefined) result[key] = p[key];
      for (const [, score] of Object.values(fields)) result[score] = p[score];
      return result;
    });
    if (previous.some(p => !names.has(p.name))) throw Error('Indici incompleti: manca una provincia già presente');
    for (const [key, [quantity]] of Object.entries(fields)) {
      const rows = raw[key]?.ranking;
      if (!Array.isArray(rows) || rows.length < 100) throw Error('Classifica incompleta: ' + key);
      const map = new Map();
      for (const r of rows) {
        if (!r || typeof r.province_name !== 'string' || !r.province_name.trim() || !count(r.count) || map.has(r.province_name)) throw Error('Classifica non valida: ' + key);
        map.set(r.province_name, r.count);
      }
      for (const p of items) {
        if (!map.has(p.name)) throw Error(key + ': provincia mancante ' + p.name);
        p[quantity] = map.get(p.name);
      }
    }
    validateItems(items);
    return {date: date.toLocaleString('it-IT'), fetchedAt: date.toISOString(), items, scoresSynced: true, source: 'Diplomacia Firefox'};
  }
  function signature(items) {
    return JSON.stringify(items.map(p => [p.name, ...Object.values(fields).flatMap(([q,s]) => [p[q],p[s]]), p.country_name, p.player_count, p.region]).sort((a,b) => a[0].localeCompare(b[0])));
  }
  root.DipCore = {fields, keys, gameURL, validateEndpoints, classify, validateItems, snapshot, signature};
})(globalThis);
