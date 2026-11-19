/* ══════════════════════════════════════════════════════════════
   PAPY LA POPOTE — carnet.js
   Le carnet de recettes personnel.
   · Dans les livres : un bouton « ♡ Mon carnet » sur chaque recette
     (à charger AVANT livre.js, qui découpe ensuite le livre en pages).
   · Les recettes choisies sont gardées sur l'appareil (localStorage,
     clé « papy-carnet ») et se lisent sur la page carnet.html.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CLE = 'papy-carnet';
  var Carnet = window.PapyCarnet = {
    lire: function () { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return []; } },
    ecrire: function (l) { try { localStorage.setItem(CLE, JSON.stringify(l)); return true; } catch (e) { alert("Le carnet n'a pas pu être enregistré sur cet appareil (mémoire pleine ou navigation privée)."); return false; } },
    a: function (id) { return Carnet.lire().some(function (r) { return r.id === id; }); },
    retirer: function (id) { Carnet.ecrire(Carnet.lire().filter(function (r) { return r.id !== id; })); }
  };
  if (!document.body.classList.contains('livre-recettes')) return;   // page carnet.html : seulement la boîte à outils

  /* 1. Avant que livre.js ne découpe le livre : on garde une copie propre de chaque recette */
  var tome = (document.title.split('—')[0] || '').trim();
  var genreLivre = /sucr/i.test(location.pathname) ? 'sucree' : (/sal/i.test(location.pathname) ? 'salee' : '');
  var recettes = {}, genre = genreLivre;
  [].forEach.call(document.querySelectorAll('.produit-layout section'), function (s) {
    if (s.id === 'partie-salees') genre = 'salee';
    if (s.id === 'partie-sucrees') genre = 'sucree';
    if (!s.classList.contains('recette') || !s.id) return;
    var copie = s.cloneNode(true);
    [].forEach.call(copie.querySelectorAll('img'), function (i) { i.src = new URL(i.getAttribute('src'), location.href).href; i.removeAttribute('loading'); });
    var h2 = s.querySelector('h2');
    var titre = h2 ? h2.textContent.replace(/^\s*\S+\s*/, function (m) { return h2.querySelector('.section-titre-icon') ? '' : m; }).trim() : s.id;
    if (h2 && h2.querySelector('.section-titre-icon')) titre = h2.textContent.slice(h2.querySelector('.section-titre-icon').textContent.length).trim();
    var cap = s.querySelector('figcaption');
    var lieu = cap ? cap.textContent.split('·').slice(1).map(function (x) { return x.trim(); }).filter(Boolean).pop() || '' : '';
    recettes[s.id] = { id: s.id, titre: titre, genre: genre, tome: tome, lieu: lieu,
      lien: location.pathname.split('/').pop() + '#' + s.id, html: copie.outerHTML };
  });

  /* 2. Boutons : ajoutés dans les pages construites par livre.js (la section y porte data-chapitre = id de la recette)
        ou dans les recettes en mode « Défilement » (la section garde son id) */
  function poserBoutons() {
    [].forEach.call(document.querySelectorAll('section.recette'), function (sec) {
      if (sec.classList.contains('livre-suite')) return;
      var id = sec.getAttribute('data-chapitre') || sec.id;
      if (!id || !recettes[id]) return;
      var h2 = sec.querySelector('h2.section-titre');
      if (!h2 || h2.querySelector('.carnet-btn')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'carnet-btn'; b.setAttribute('data-carnet', id);
      h2.appendChild(b);
    });
  }
  function majBoutons() {
    poserBoutons();
    var l = Carnet.lire(), ids = {};
    l.forEach(function (r) { ids[r.id] = 1; });
    [].forEach.call(document.querySelectorAll('[data-carnet]'), function (b) {
      var dedans = !!ids[b.getAttribute('data-carnet')];
      /* libellé affiché par le CSS (::after) : il n'entre pas dans le texte du titre, que livre.js recopie au sommaire */
      var t = dedans ? 'Retirer de mon carnet' : 'Ajouter à mon carnet';
      if (b.getAttribute('aria-label') !== t) b.setAttribute('aria-label', t);
      b.classList.toggle('dedans', dedans);
      b.title = dedans ? 'Retirer cette recette de mon carnet' : 'Ajouter cette recette à mon carnet de recettes';
    });
    var n = String(l.length), nb = lien.querySelector('b');
    if (nb.textContent !== n) nb.textContent = n;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-carnet]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var id = b.getAttribute('data-carnet'), l = Carnet.lire();
    if (l.some(function (r) { return r.id === id; })) l = l.filter(function (r) { return r.id !== id; });
    else if (recettes[id]) { var r = recettes[id]; r.ajout = Date.now(); l.push(r); }
    if (Carnet.ecrire(l)) { majBoutons(); bulle(Carnet.a(id) ? '📒 Recette ajoutée à votre carnet' : 'Recette retirée du carnet'); }
  }, true);

  /* 3. Lien permanent vers le carnet */
  var lien = document.createElement('a');
  lien.className = 'carnet-lien'; lien.href = '../carnet.html';
  lien.innerHTML = '📒 Mon carnet (<b>0</b>)';
  lien.title = 'Ouvrir mon carnet de recettes';
  document.body.appendChild(lien);
  var info = document.createElement('div'); info.className = 'carnet-bulle'; info.setAttribute('role', 'status'); document.body.appendChild(info);
  var minuterie;
  function bulle(t) { info.textContent = t; info.classList.add('vue'); clearTimeout(minuterie); minuterie = setTimeout(function () { info.classList.remove('vue'); }, 1800); }

  var st = document.createElement('style');
  st.textContent =
    '.carnet-btn{display:inline-block;vertical-align:middle;margin-left:10px;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;font-style:normal;' +
    'padding:6px 11px;border-radius:999px;border:1.5px solid #6c2818;background:#fffaf0;color:#6c2818;cursor:pointer;white-space:nowrap}' +
    '.carnet-btn::after{content:"♡ Mon carnet"}.carnet-btn.dedans::after{content:"✓ Dans mon carnet"}' +
    '.carnet-btn:hover,.carnet-btn:focus-visible{background:#6c2818;color:#fff;outline:none}' +
    '.carnet-btn.dedans{background:#3B6D11;border-color:#3B6D11;color:#fff}' +
    '.carnet-lien{position:fixed;left:14px;bottom:14px;z-index:210;padding:9px 16px;border-radius:26px;background:#6c2818;color:#fff;text-decoration:none;' +
    'font:600 15px system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 3px 12px rgba(60,30,10,.3);border:1px solid #FAC775}' +
    '.carnet-lien:hover,.carnet-lien:focus-visible{background:#C8843A;outline:none}' +
    '.carnet-bulle{position:fixed;left:50%;top:18px;transform:translate(-50%,-20px);z-index:300;background:#3a2414;color:#fff;padding:10px 18px;border-radius:12px;' +
    'font:600 15px system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}' +
    '.carnet-bulle.vue{opacity:1;transform:translate(-50%,0)}' +
    '@media (max-width:640px){.carnet-lien{left:10px;bottom:10px;font-size:13px;padding:8px 12px}.carnet-btn{font-size:12px;padding:5px 9px;margin-left:6px}}' +
    '@media print{.carnet-btn,.carnet-lien,.carnet-bulle{display:none!important}}';
  document.head.appendChild(st);

  majBoutons();
  /* les pages du livre sont créées après ce script : on met à jour les boutons recopiés */
  window.addEventListener('load', function () { setTimeout(majBoutons, 300); setTimeout(majBoutons, 1500); });
  new MutationObserver(function () { clearTimeout(majBoutons.t); majBoutons.t = setTimeout(majBoutons, 120); })
    .observe(document.body, { childList: true, subtree: true });
  window.addEventListener('storage', majBoutons);
  window.addEventListener('pageshow', majBoutons);
})();
