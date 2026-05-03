// ─── Config ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wkvtkcuoohiawiewqoao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnRrY3Vvb2hpYXdpZXdxb2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTI1MDMsImV4cCI6MjA5MzMyODUwM30.aGqkmaiVe-oH6lyxdtC9joLI-ciPjVF0nJHTYa7XSS8';
const BUCKET_NAME = 'moment-images';

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

// ─── Seeded RNG ───────────────────────────────────────────
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
  if (!text) return;

  const btn = document.querySelector('.add-btn');
  const status = document.getElementById('submitStatus');
  btn.disabled = true;
  status.style.display = 'block';
  status.style.color = '#8a6a4a';
  status.textContent = 'saving your moment…';

  try {
    let imageUrl = null;
    if (selectedFile) {
      const filename = `${Date.now()}-${selectedFile.name.replace(/\s/g,'_')}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': selectedFile.type, 'x-upsert': 'false' },
        body: selectedFile
      });
      if (!up.ok) throw new Error('Image upload failed');
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
    }

    const db = await fetch(`${SUPABASE_URL}/rest/v1/moments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ text, image_url: imageUrl })
    });
    if (!db.ok) throw new Error(await db.text());

    input.value = '';
    clearImage();
    status.textContent = "✓ your moment was added — it'll appear once we've read it";
    setTimeout(() => { status.style.display = 'none'; }, 4500);
  } catch(err) {
    console.error(err);
    status.textContent = 'something went wrong — please try again';
    status.style.color = '#b06040';
  } finally {
    btn.disabled = false;
  }
}

// ─── Load ─────────────────────────────────────────────────
async function loadMoments() {
  const container = document.getElementById('bubblesContainer');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/moments?approved=eq.true&order=created_at.desc&limit=40`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error();
    const moments = await res.json();
    container.innerHTML = '';
    if (!moments.length) { container.innerHTML = '<div class="loading-state">be the first to share a moment</div>'; return; }
    expandIntoBubbles(moments).forEach((b, i) => container.appendChild(buildBubble(b, i)));
  } catch(err) {
    container.innerHTML = '';
    expandIntoBubbles(getSeedMoments()).forEach((b, i) => container.appendChild(buildBubble(b, i)));
  }
  initScrollReveal();
}

// ─── Expand moments → bubble specs ───────────────────────
function expandIntoBubbles(moments) {
  const out = [];
  moments.forEach((m, mi) => {
    const hasText  = !!(m.text && m.text.trim());
    const hasImage = !!m.image_url;
    if (hasText && hasImage) {
      if (rng(mi * 7 + 3) < 0.4) {
        out.push({ type: 'combined', text: m.text, image_url: m.image_url, created_at: m.created_at, seed: mi });
      } else {
        const imgFirst = rng(mi * 13 + 5) > 0.5;
        const a = { type: 'image-only', image_url: m.image_url, created_at: m.created_at, seed: mi * 100 };
        const b = { type: 'text-only',  text: m.text,           created_at: m.created_at, seed: mi * 100 + 1 };
        out.push(...(imgFirst ? [a, b] : [b, a]));
      }
    } else if (hasImage) {
      out.push({ type: 'image-only', image_url: m.image_url, created_at: m.created_at, seed: mi });
    } else if (hasText) {
      out.push({ type: 'text-only', text: m.text, created_at: m.created_at, seed: mi });
    }
  });
  return out;
}

// ─── Build bubble element ─────────────────────────────────
function buildBubble(spec, index) {
  const seed    = spec.seed !== undefined ? spec.seed : index;
  const palette = PALETTES[index % PALETTES.length];
  const shape   = SHAPES[Math.floor(rng(seed * 3 + 7)  * SHAPES.length)];
  const bob     = BOBS[Math.floor(rng(seed * 5 + 11)   * BOBS.length)];
  const dur     = (3.5 + rng(seed * 2 + 1) * 4).toFixed(1) + 's';
  const delay   = (rng(seed * 4 + 2) * 2).toFixed(1) + 's';

  const textLen = spec.text ? spec.text.length : 0;
  const fontSize = textLen < 40 ? 16 : textLen > 160 ? 12 : 14;

  // size: image bubbles bigger, pill shapes wider
  let w, h;
  if (spec.type === 'text-only') {
    const base = 130 + Math.floor(rng(seed) * 100);
    w = shape === 'shape-pill' ? Math.floor(base * 1.6) : base;
    h = shape === 'shape-pill' ? Math.floor(base * 0.7) : base;
  } else {
    const base = 170 + Math.floor(rng(seed) * 80);
    w = shape === 'shape-pill' ? Math.floor(base * 1.5) : base;
    h = shape === 'shape-pill' ? Math.floor(base * 0.75) : base;
  }

  const wrap = document.createElement('div');
  wrap.className = `bubble ${bob}`;
  wrap.style.cssText = `--dur:${dur}; --delay:${delay}; margin-bottom:34px; margin: 12px;`;

  const inner = document.createElement('div');
  inner.className = `bubble-inner ${shape}`;
  inner.style.width  = `${w}px`;
  inner.style.height = `${h}px`;

  if (spec.type === 'text-only') {
    inner.classList.add('tinted');
    inner.style.background = palette.bg;
    inner.style.border = `1px solid ${palette.border}`;

    const p = document.createElement('p');
    p.className = 'bubble-text';
    p.style.cssText = `color:${palette.color}; font-size:${fontSize}px; max-width:${Math.floor(w * 0.72)}px;`;
    p.textContent = spec.text;
    inner.appendChild(p);

  } else if (spec.type === 'image-only') {
    inner.style.background = '#c0b0a0';
    inner.style.border = '1px solid rgba(255,255,255,0.28)';
    inner.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
    img.src = spec.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);

  } else { // combined
    inner.style.background = '#c0b0a0';
    inner.style.border = '1px solid rgba(255,255,255,0.22)';
    inner.style.overflow = 'hidden';
    inner.style.position = 'relative';

    const img = document.createElement('img');
    img.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover;';
    img.src = spec.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);

    const veil = document.createElement('div');
    veil.style.cssText = 'position:absolute; inset:0; background:radial-gradient(ellipse at center, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.1) 100%);';
    inner.appendChild(veil);

    const p = document.createElement('p');
    p.className = 'bubble-text';
    p.style.cssText = `position:relative; z-index:2; color:#f5ead8; font-size:${fontSize}px; max-width:${Math.floor(w*0.66)}px; text-shadow:0 1px 8px rgba(0,0,0,0.7);`;
    p.textContent = spec.text;
    inner.appendChild(p);
  }

  wrap.appendChild(inner);

  const meta = document.createElement('div');
  meta.className = 'bubble-meta';
  meta.textContent = formatTime(spec.created_at);
  wrap.appendChild(meta);

  return wrap;
}

// ─── Scroll reveal ────────────────────────────────────────
function initScrollReveal() {
  const bubbles = document.querySelectorAll('.bubble');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // stagger slightly based on position
        const el = entry.target;
        const delay = parseFloat(el.style.getPropertyValue('--delay') || '0');
        setTimeout(() => el.classList.add('visible'), delay * 100);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  bubbles.forEach(b => observer.observe(b));
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
    { text: 'the way coffee steam bent sideways when the window opened just slightly', created_at: new Date(Date.now()-3600000).toISOString() },
    { text: 'I noticed the light was already different. Still summer but somehow the angle had shifted.', created_at: new Date(Date.now()-86400000).toISOString() },
    { text: 'a stranger held the door open so long I had to slightly jog', created_at: new Date(Date.now()-172800000).toISOString() },
    { text: 'my dog stopped and sniffed the same patch of sidewalk for nearly two full minutes. I let her.', created_at: new Date(Date.now()-259200000).toISOString() },
    { text: 'floating', created_at: new Date(Date.now()-300000).toISOString() },
    { text: 'the smell of rain before it actually started. That maybe five-second window.', created_at: new Date(Date.now()-345600000).toISOString() },
    { text: 'she covered her mouth when she laughed. I\'d never noticed before.', created_at: new Date(Date.now()-432000000).toISOString() },
    { text: 'tiny handprints in the bus window fog', created_at: new Date(Date.now()-518400000).toISOString() },
    { text: 'two pigeons sharing a chip. one waited.', created_at: new Date(Date.now()-604800000).toISOString() },
    { text: 'I\'ve been holding my breath when I open my email. Still trying to stop.', created_at: new Date(Date.now()-691200000).toISOString() },
  ];
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('momentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitMoment(); }
  });
  loadMoments();
});
