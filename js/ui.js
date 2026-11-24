/* =========================================================
   ui.js – kleine Helfer für HTML/SVG, Figuren, Dialoge
   ========================================================= */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  function h(tag, props, ...children) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    append(e, children);
    return e;
  }
  function append(e, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  }

  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'text') e.textContent = v;
        else if (k === 'href') e.setAttribute('href', v);
        else e.setAttribute(k, v);
      }
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmt(x, d) {
    d = d == null ? 0 : d;
    return Number(x).toFixed(d).replace('.', ',');
  }

  /* ---------- Figuren (SVG) ---------- */
  const AVATARS = {
    lumi: `<svg viewBox="0 0 64 64" aria-hidden="true">
      <line x1="32" y1="12" x2="32" y2="5" stroke="#9fd8ff" stroke-width="2.5"/>
      <circle cx="32" cy="5" r="3.6" fill="#ffd34d" class="lumi-bulb"/>
      <rect x="9" y="12" width="46" height="38" rx="14" fill="#2b3d6e" stroke="#9fd8ff" stroke-width="2.5"/>
      <rect x="15" y="20" width="34" height="17" rx="8.5" fill="#0d1630"/>
      <circle cx="25" cy="28.5" r="4" fill="#5ff0ff" class="lumi-eye"/>
      <circle cx="39" cy="28.5" r="4" fill="#5ff0ff" class="lumi-eye"/>
      <path d="M25 43 Q32 47 39 43" stroke="#9fd8ff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="4" y="25" width="5" height="12" rx="2.5" fill="#9fd8ff"/>
      <rect x="55" y="25" width="5" height="12" rx="2.5" fill="#9fd8ff"/>
      <rect x="20" y="50" width="24" height="9" rx="4" fill="#2b3d6e" stroke="#9fd8ff" stroke-width="2"/>
    </svg>`,
    prof: `<svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="12" r="8" fill="#c9ccd6"/>
      <path d="M12 60 Q14 44 32 43 Q50 44 52 60 Z" fill="#f2f2f2" stroke="#b9bfcc" stroke-width="1.5"/>
      <path d="M28 44 L32 52 L36 44" fill="#5b6bd6"/>
      <circle cx="32" cy="29" r="15" fill="#e8b98f"/>
      <path d="M17 28 Q17 13 32 14 Q47 13 47 28 Q42 20 32 20 Q22 20 17 28Z" fill="#c9ccd6"/>
      <circle cx="26" cy="30" r="5" fill="none" stroke="#33405e" stroke-width="2"/>
      <circle cx="38" cy="30" r="5" fill="none" stroke="#33405e" stroke-width="2"/>
      <line x1="31" y1="30" x2="33" y2="30" stroke="#33405e" stroke-width="2"/>
      <circle cx="26" cy="30" r="1.6" fill="#33405e"/>
      <circle cx="38" cy="30" r="1.6" fill="#33405e"/>
      <path d="M27 37 Q32 40 37 37" stroke="#8a4b3a" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
  };
  const NAMES = { lumi: 'LUMI', prof: 'Prof. Okular' };

  function avatar(who, cls) {
    return h('div', { class: 'avatar avatar-' + who + (cls ? ' ' + cls : ''), html: AVATARS[who] });
  }

  /* Dialog: Liste von {who, text} */
  function dialog(lines) {
    const wrap = h('div', { class: 'dialog' });
    lines.forEach((l, i) => {
      const row = h('div', { class: 'say say-' + l.who, style: { animationDelay: (i * 0.25) + 's' } },
        avatar(l.who),
        h('div', { class: 'bubble' }, h('div', { class: 'who' }, NAMES[l.who]), h('div', { html: l.text }))
      );
      wrap.append(row);
    });
    return wrap;
  }

  /* kleine Rückmeldung mit LUMI */
  function feedback(kind, html) {
    return h('div', { class: 'feedback fb-' + kind, role: 'status' },
      avatar('lumi', 'mini'), h('div', { html })
    );
  }

  function box(kind, title, html) {
    return h('div', { class: 'box box-' + kind },
      title ? h('div', { class: 'box-title' }, title) : null,
      h('div', { html })
    );
  }

  function btn(label, onClick, cls) {
    return h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick: onClick, html: label });
  }

  /* Schieberegler mit Label und Feineinstellung */
  function slider(opts) {
    const { label, min, max, step, value, onInput, format, fine } = opts;
    const out = h('output', { class: 'slider-out' });
    const input = h('input', { type: 'range', min, max, step: step || 1, value, 'aria-label': label.replace(/<[^>]+>/g, '') });
    const set = (v, fire) => {
      v = Math.max(min, Math.min(max, v));
      input.value = v;
      out.innerHTML = format ? format(Number(input.value)) : input.value;
      if (fire !== false && onInput) onInput(Number(input.value));
    };
    input.addEventListener('input', () => set(Number(input.value)));
    const f = fine || step || 1;
    const minus = h('button', { type: 'button', class: 'fine', 'aria-label': 'weniger', onclick: () => set(Number(input.value) - f) }, '−');
    const plus = h('button', { type: 'button', class: 'fine', 'aria-label': 'mehr', onclick: () => set(Number(input.value) + f) }, '+');
    const el = h('div', { class: 'slider' }, h('label', { html: label }), h('div', { class: 'slider-row' }, minus, input, plus), out);
    set(value, false);
    return { el, set, get: () => Number(input.value), input };
  }

  /* Segment-Umschalter */
  function segmented(options, value, onChange) {
    const el = h('div', { class: 'segmented', role: 'radiogroup' });
    const btns = options.map((o) => {
      const b = h('button', { type: 'button', role: 'radio', class: o.value === value ? 'on' : '', html: o.label,
        onclick: () => { set(o.value); onChange(o.value); } });
      el.append(b);
      return b;
    });
    function set(v) {
      value = v;
      btns.forEach((b, i) => { const on = options[i].value === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    }
    set(value);
    return { el, set, get: () => value };
  }

  function toggle(label, checked, onChange) {
    const input = h('input', { type: 'checkbox' });
    input.checked = !!checked;
    input.addEventListener('change', () => onChange(input.checked));
    return { el: h('label', { class: 'toggle' }, input, h('span', { class: 'track' }), h('span', { html: label })), input };
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  window.UI = { h, s, append, esc, fmt, avatar, dialog, feedback, box, btn, slider, segmented, toggle, shuffle, NS };
})();
