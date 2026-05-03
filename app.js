// ─── Config ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wkvtkcuoohiawiewqoao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnRrY3Vvb2hpYXdpZXdxb2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTI1MDMsImV4cCI6MjA5MzMyODUwM30.aGqkmaiVe-oH6lyxdtC9joLI-ciPjVF0nJHTYa7XSS8';
const BUCKET_NAME = 'moment-images';

// ─── Bubble color palettes ────────────────────────────────
const PALETTES = [
  { bg: 'rgba(255,240,210,0.72)', border: 'rgba(210,160,80,0.45)',  color: '#5a3010' },
  { bg: 'rgba(230,220,255,0.65)', border: 'rgba(160,140,210,0.40)', color: '#3a2860' },
  { bg: 'rgba(210,240,230,0.68)', border: 'rgba(80,170,140,0.40)',  color: '#1a4a38' },
  { bg: 'rgba(255,235,215,0.70)', border: 'rgba(210,140,80,0.40)',  color: '#5a2808' },
  { bg: 'rgba(220,235,255,0.65)', border: 'rgba(100,150,220,0.40)', color: '#1a3060' },
  { bg: 'rgba(240,230,255,0.68)', border: 'rgba(150,120,220,0.40)', color: '#3a1860' },
  { bg: 'rgba(255,245,210,0.72)', border: 'rgba(220,180,60,0.45)',  color: '#5a3800' },
  { bg: 'rgba(215,240,250,0.68)', border: 'rgba(80,170,210,0.40)',  color: '#103848' },
  { bg: 'rgba(225,245,215,0.68)', border: 'rgba(100,180,90,0.40)',  color: '#1a4010' },
  { bg: 'rgba(255,225,230,0.68)', border: 'rgba(210,120,140,0.40)', color: '#5a1830' },
];

// ─── State ───────────────────────────────────────────────
let selectedFile = null;
let momentIndex = 0;

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

// ─── Submit moment ────────────────────────────────────────
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
      const filename = `${Date.now()}-${selectedFile.name.replace(/\s/g, '_')}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': selectedFile.type,
          'x-upsert': 'false'
        },
        body: selectedFile
      });
      if (!uploadRes.ok) throw new Error('Image upload failed');
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
    }

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/moments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ text, image_url: imageUrl })
    });

    if (!dbRes.ok) {
      const err = await dbRes.text();
      console.error('DB error:', err);
      throw new Error('Failed to save');
    }

    input.value = '';
    clearImage();
    status.textContent = '✓ your moment was added — it\'ll appear once we\'ve read it';
    setTimeout(() => { status.style.display = 'none'; }, 4500);

  } catch (err) {
    console.error(err);
    status.textContent = 'something went wrong — please try again';
    status.style.color = '#b06040';
  } finally {
    btn.disabled = false;
  }
}

// ─── Load moments ─────────────────────────────────────────
async function loadMoments() {
  const container = document.getElementById('bubblesContainer');

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/moments?approved=eq.true&order=created_at.desc&limit=40`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );

    if (!res.ok) throw new Error('Could not load');
    const moments = await res.json();

    container.innerHTML = '';

    if (moments.length === 0) {
      container.innerHTML = '<div class="loading-state">be the first to share a moment</div>';
      return;
    }

    moments.forEach((m, i) => container.appendChild(buildBubble(m, i)));

  } catch (err) {
    console.error(err);
    container.innerHTML = '';
    getSeedMoments().forEach((m, i) => container.appendChild(buildBubble(m, i)));
  }
}

// ─── Build bubble ─────────────────────────────────────────
// Three types:
//   image-only  — full bleed image fills the circle, no text overlay
//   text-only   — no image, soft tinted bubble with italic text
//   combined    — image fills bubble, text floats over a gentle dark veil

function buildBubble(moment, index) {
  const palette = PALETTES[index % PALETTES.length];
  const rng = seededRandom(index);
  const hasImage = !!moment.image_url;
  const hasText  = !!(moment.text && moment.text.trim());

  // Decide variant
  let variant;
  if (hasImage && hasText) {
    // 40% image-only, 40% combined, 20% text-only (image ignored)
    const roll = seededRandom(index + 100);
    variant = roll < 0.4 ? 'image-only' : roll < 0.8 ? 'combined' : 'text-only';
  } else if (hasImage) {
    variant = 'image-only';
  } else {
    variant = 'text-only';
  }

  // Size varies by variant
  const size = variant === 'text-only'
    ? 120 + Math.floor(rng * 90)
    : 160 + Math.floor(rng * 80);

  const textLen = moment.text ? moment.text.length : 0;
  const fontSize = textLen < 40 ? 15 : textLen > 160 ? 12 : 13;

  // Wrapper
  const wrap = document.createElement('div');
  wrap.className = 'bubble';
  wrap.style.animationDelay = `${index * 0.06}s`;
  wrap.style.marginBottom = '32px';

  // Inner circle
  const inner = document.createElement('div');
  inner.className = 'bubble-inner';
  inner.style.width  = `${size}px`;
  inner.style.height = `${size}px`;

  if (variant === 'text-only') {
    // Plain tinted bubble
    inner.style.background = palette.bg;
    inner.style.border = `1px solid ${palette.border}`;

    const txt = document.createElement('p');
    txt.className = 'bubble-text';
    txt.style.cssText = `color:${palette.color}; font-size:${fontSize}px; max-width:${Math.floor(size * 0.70)}px;`;
    txt.textContent = moment.text;
    inner.appendChild(txt);

  } else if (variant === 'image-only') {
    // Full-bleed image, no text, just the highlight sheen
    inner.style.background = '#c8b8a8';
    inner.style.border = `1px solid rgba(255,255,255,0.3)`;
    inner.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block; border-radius:50%;';
    img.src = moment.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);

  } else {
    // Combined: image + text over a soft dark veil
    inner.style.background = '#c8b8a8';
    inner.style.border = `1px solid rgba(255,255,255,0.25)`;
    inner.style.overflow = 'hidden';
    inner.style.position = 'relative';

    const img = document.createElement('img');
    img.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:50%;';
    img.src = moment.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);

    // Dark veil so text is legible
    const veil = document.createElement('div');
    veil.style.cssText = `
      position:absolute; inset:0; border-radius:50%;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 100%);
    `;
    inner.appendChild(veil);

    const txt = document.createElement('p');
    txt.className = 'bubble-text';
    txt.style.cssText = `
      position:relative; z-index:2;
      color:#f5ead8;
      font-size:${fontSize}px;
      max-width:${Math.floor(size * 0.68)}px;
      text-shadow: 0 1px 6px rgba(0,0,0,0.6);
    `;
    txt.textContent = moment.text;
    inner.appendChild(txt);
  }

  wrap.appendChild(inner);

  // Timestamp below bubble
  const meta = document.createElement('div');
  meta.className = 'bubble-meta';
  meta.textContent = formatTime(moment.created_at);
  wrap.appendChild(meta);

  return wrap;
}

// ─── Helpers ──────────────────────────────────────────────
function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function formatTime(createdAt) {
  if (!createdAt) return '';
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getSeedMoments() {
  return [
    { text: 'the way coffee steam bent sideways when the window opened just slightly', created_at: new Date(Date.now() - 3600000).toISOString() },
    { text: 'I noticed the light was already different. Still summer but somehow the angle had shifted.', created_at: new Date(Date.now() - 86400000).toISOString() },
    { text: 'a stranger held the door open so long I had to slightly jog', created_at: new Date(Date.now() - 172800000).toISOString() },
    { text: 'my dog stopped and sniffed the same patch of sidewalk for nearly two full minutes. I let her.', created_at: new Date(Date.now() - 259200000).toISOString() },
    { text: 'floating', created_at: new Date(Date.now() - 300000).toISOString() },
    { text: 'the smell of rain before it actually started. That maybe five-second window.', created_at: new Date(Date.now() - 345600000).toISOString() },
    { text: 'she covered her mouth when she laughed. I\'d never noticed before.', created_at: new Date(Date.now() - 432000000).toISOString() },
    { text: 'tiny handprints in the bus window fog', created_at: new Date(Date.now() - 518400000).toISOString() },
    { text: 'two pigeons sharing a chip. one waited.', created_at: new Date(Date.now() - 604800000).toISOString() },
    { text: 'I\'ve been holding my breath when I open my email. Still trying to stop.', created_at: new Date(Date.now() - 691200000).toISOString() },
  ];
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('momentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitMoment();
    }
  });
  loadMoments();
});
