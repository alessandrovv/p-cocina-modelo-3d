import { VERSION, cambiarVersion } from '../config/reposteros.js';

/** Conecta los botones de la barra con las vistas y las capas. */
export function bindToolbar({ views, estado, onToggle }) {
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const legend = document.getElementById('legend');

  for (const b of document.querySelectorAll('[data-version]')) {
    const v = Number(b.dataset.version);
    b.classList.toggle('active', v === VERSION);
    b.addEventListener('click', () => v !== VERSION && cambiarVersion(v));
  }
  document.getElementById('planos').href = `reposteros.html?v=${VERSION}`;

  const marcarVista = (name) => {
    for (const b of viewButtons) b.classList.toggle('active', b.dataset.view === name);
  };
  const irA = (name) => {
    views.set(name);
    marcarVista(name);
  };

  for (const b of viewButtons) b.addEventListener('click', () => irA(b.dataset.view));
  document.getElementById('reset').addEventListener('click', () => irA('iso'));

  const toggleButtons = [...document.querySelectorAll('[data-toggle]')];
  const sync = () => {
    for (const b of toggleButtons) b.setAttribute('aria-pressed', String(Boolean(estado[b.dataset.toggle])));
    legend.hidden = !estado.cotas;
  };
  const toggle = (key) => {
    estado[key] = !estado[key];
    onToggle();
    sync();
  };
  for (const b of toggleButtons) b.addEventListener('click', () => toggle(b.dataset.toggle));
  sync();

  // Al girar libremente, la vista deja de corresponder a un botón.
  views.controls.addEventListener('start', () => {
    if (!views.tween) marcarVista(null);
  });

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'r') irA('iso');
    else if (k === 't') irA('top');
    else if (k === 'c') toggle('cotas');
    else if (k === 'p') toggle('puertas');
    else if (['1', '2', '3', '4'].includes(k)) irA(`pared${k}`);
  });
}
