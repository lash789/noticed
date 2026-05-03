// ─── Config ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wkvtkcuoohiawiewqoao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnRrY3Vvb2hpYXdpZXdxb2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTI1MDMsImV4cCI6MjA5MzMyODUwM30.aGqkmaiVe-oH6lyxdtC9joLI-ciPjVF0nJHTYa7XSS8';

const PALETTES = [
  { bg: 'rgba(255,240,210,0.75)', border: 'rgba(210,160,80,0.45)',  color: '#5a3010' },
  { bg: 'rgba(230,220,255,0.68)', border: 'rgba(160,140,210,0.40)', color: '#3a2860' },
  { bg: 'rgba(210,240,230,0.70)', border: 'rgba(80,170,140,0.40)',  color: '#1a4a38' },
  { bg: 'rgba(255,235,215,0.72)', border: 'rgba(210,140,80,0.40)',  color: '#5a2808' },
  { bg: 'rgba(220,235,255,0.68)', border: 'rgba(100,150,220,0.40)', color: '#1a3060' },
  { bg: 'rgba(240,230,255,0.70)', border: 'rgba(150,120,220,0.40)', color: '#3a1860' },
  { bg: 'rgba(255,248,215,0.75)', border: 'rgba(220,180,60,0.45)',  color: '#5a3800' },
  { bg: 'rgba(215,240,250,0.70)', border: 'rgba(80,170,210,0.40)',  color: '#103848' },
  { bg: 'rgba(228,248,218,0.70)', border: 'rgba(100,180,90,0.40)',  color: '#1a4010' },
  { bg: 'rgba(255,228,232,0.70)', border: 'rgba(210,120,140,0.40)', color: '#5a1830' },
];

const SHAPES = ['shape-circle','shape-squircle','shape-blob1','shape-blob2','shape-blob3','shape-pill'];
const BOBS   = ['bob-a','bob-b','bob-c','bob-d','bob-e','bob-f'];

let selectedFile = null;

function rng(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Image preview ───────────────────────────────────────
function previewImage(e) {
  selectedFile = e.target.files[0];
  if (!selectedFile) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('imagePreview').src = ev.target.result;
    document.getElementById('imagePreviewWrap').style.display = 'block';
  };
  reader.readAsDataURL(selectedFile);
}

function clearImage() {
  selectedFile = null;
  document.getElementById('imageInput').value = '';
  document.getElementById('imagePreviewWrap').style.display = 'none';
  document.getElementById('imagePreview').src = '';
}

// ─── Submit ───────────────────────────────────────────────
async function submitMoment() {
  const input = document.getElementById('momentInput');
  const text = input.value.trim();
  const hasText = text.length > 0;
  const hasImage = !!selectedFile;

  if (!hasText && !hasImage) {
    const status = document.getElementById('submitStatus');
    status.style.display = 'block';
    status.style.color = '#b06040';
    status.textContent = 'Please share something — words, an image, or both.';
    return;
  }

  const btn = document.querySelector('.add-btn');
  const status = document.getElementById('submitStatus');
  btn.disabled = true;
  status.style.display = 'block';
  status.style.color = '#8a6a4a';
  status.textContent = 'catching your moment…';

  try {
    const formData = new FormData();
    if (hasText) formData.append('text', text);
    if (hasImage) formData.append('image', selectedFile);

    const res = await fetch('/api/moderate', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      input.value = '';
      clearImage();
      status.style.color = '#8a6a4a';
      status.textContent = '✓ ' + data.message;
      setTimeout(() => { status.style.display = 'none'; loadMoments(); }, 3000);
    } else {
      status.style.color = '#b06040';
      status.textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    status.style.color = '#b06040';
    status.textContent = 'something went wrong — please try again';
  } finally {
    btn.disabled = false;
  }
}

// ─── Load moments ─────────────────────────────────────────
async function loadMoments() {
  const container = document.getElementById('bubblesContainer');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/moments?approved=eq.true&order=created_at.desc&limit=60`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error();
    const moments = await res.json();
    container.innerHTML = '';
    if (!moments.length) { container.innerHTML = '<div class="loading-state">be the first to share a moment</div>'; return; }
    moments.forEach((m, i) => container.appendChild(buildBubble(m, i)));
  } catch(err) {
    container.innerHTML = '';
    getSeedMoments().forEach((m, i) => container.appendChild(buildBubble(m, i)));
  }
  initScrollReveal();
}

// ─── Build bubble ─────────────────────────────────────────
// Images always stay with their text — no splitting.
// Three types: text-only, image-only, combined (image+text together).

function buildBubble(moment, index) {
  const seed     = index;
  const palette  = PALETTES[index % PALETTES.length];
  const shape    = SHAPES[Math.floor(rng(seed * 3 + 7) * SHAPES.length)];
  const bob      = BOBS[Math.floor(rng(seed * 5 + 11) * BOBS.length)];
  const dur      = (3.5 + rng(seed * 2 + 1) * 4).toFixed(1) + 's';
  const delay    = (rng(seed * 4 + 2) * 2).toFixed(1) + 's';

  const hasText  = !!(moment.text && moment.text.trim());
  const hasImage = !!moment.image_url;
  const type     = hasImage && hasText ? 'combined' : hasImage ? 'image-only' : 'text-only';

  const textLen  = moment.text ? moment.text.length : 0;
  const fontSize = textLen < 40 ? 15 : textLen > 160 ? 11 : 13;

  // Size — smaller on mobile via CSS, base size set here
  let w, h;
  if (type === 'text-only') {
    const base = 110 + Math.floor(rng(seed) * 80); // 110–190
    w = shape === 'shape-pill' ? Math.floor(base * 1.7) : base;
    h = shape === 'shape-pill' ? Math.floor(base * 0.65) : base;
  } else {
    const base = 130 + Math.floor(rng(seed) * 70); // 130–200
    w = shape === 'shape-pill' ? Math.floor(base * 1.6) : base;
    h = shape === 'shape-pill' ? Math.floor(base * 0.7) : base;
  }

  const wrap = document.createElement('div');
  wrap.className = `bubble ${bob}`;
  wrap.style.cssText = `--dur:${dur}; --delay:${delay};`;

  const inner = document.createElement('div');
  inner.className = `bubble-inner ${shape}`;
  inner.style.width  = `${w}px`;
  inner.style.height = `${h}px`;

  if (type === 'text-only') {
    inner.classList.add('tinted');
    inner.style.background = palette.bg;
    inner.style.border = `1px solid ${palette.border}`;
    const p = document.createElement('p');
    p.className = 'bubble-text';
    p.style.cssText = `color:${palette.color}; font-size:${fontSize}px; max-width:${Math.floor(w * 0.72)}px;`;
    p.textContent = moment.text;
    inner.appendChild(p);

  } else if (type === 'image-only') {
    inner.style.cssText += '; background:#c0b0a0; border:1px solid rgba(255,255,255,0.28); overflow:hidden;';
    const img = document.createElement('img');
    img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
    img.src = moment.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);

  } else {
    // Combined — image fills bubble, text overlays with veil
    inner.style.cssText += '; background:#c0b0a0; border:1px solid rgba(255,255,255,0.22); overflow:hidden; position:relative;';
    const img = document.createElement('img');
    img.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover;';
    img.src = moment.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);
    const veil = document.createElement('div');
    veil.style.cssText = 'position:absolute; inset:0; background:radial-gradient(ellipse at center, rgba(0,0,0,0.52) 25%, rgba(0,0,0,0.08) 100%);';
    inner.appendChild(veil);
    const p = document.createElement('p');
    p.className = 'bubble-text';
    p.style.cssText = `position:relative; z-index:2; color:#f5ead8; font-size:${fontSize}px; max-width:${Math.floor(w*0.68)}px; text-shadow:0 1px 8px rgba(0,0,0,0.8);`;
    p.textContent = moment.text;
    inner.appendChild(p);
  }

  wrap.appendChild(inner);

  const meta = document.createElement('div');
  meta.className = 'bubble-meta';
  meta.textContent = formatTime(moment.created_at);
  wrap.appendChild(meta);

  return wrap;
}

// ─── Scroll reveal ────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        setTimeout(() => el.classList.add('visible'), rng(Array.from(document.querySelectorAll('.bubble')).indexOf(el)) * 200);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.bubble').forEach(b => observer.observe(b));
}

// ─── Helpers ──────────────────────────────────────────────
function formatTime(createdAt) {
  if (!createdAt) return '';
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)} days ago`;
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getSeedMoments() {
  return [
    { text: 'the way coffee steam bent sideways when the window opened', created_at: new Date(Date.now()-3600000).toISOString() },
    { text: 'I noticed the light was already different. Still summer but somehow the angle had shifted.', created_at: new Date(Date.now()-86400000).toISOString() },
    { text: 'a stranger held the door open so long I had to slightly jog', created_at: new Date(Date.now()-172800000).toISOString() },
    { text: 'my dog stopped and sniffed the same patch of sidewalk for two full minutes. I let her.', created_at: new Date(Date.now()-259200000).toISOString() },
    { text: 'floating', created_at: new Date(Date.now()-300000).toISOString() },
    { text: 'the smell of rain before it started. That five-second window.', created_at: new Date(Date.now()-345600000).toISOString() },
    { text: 'she covered her mouth when she laughed. I\'d never noticed before.', created_at: new Date(Date.now()-432000000).toISOString() },
    { text: 'tiny handprints in the bus window fog', created_at: new Date(Date.now()-518400000).toISOString() },
    { text: 'two pigeons sharing a chip. one waited.', created_at: new Date(Date.now()-604800000).toISOString() },
    { text: 'holding my breath every time I open my email. Still trying to stop.', created_at: new Date(Date.now()-691200000).toISOString() },
  ];
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('momentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitMoment(); }
  });
  loadMoments();
});
