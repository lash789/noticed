const SUPABASE_URL = 'https://wkvtkcuoohiawiewqoao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnRrY3Vvb2hpYXdpZXdxb2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTI1MDMsImV4cCI6MjA5MzMyODUwM30.aGqkmaiVe-oH6lyxdtC9joLI-ciPjVF0nJHTYa7XSS8';
const BUCKET_NAME = 'moment-images';

const PALETTES = [
  { bg: 'rgba(255,240,210,0.80)', border: 'rgba(210,160,80,0.45)',  color: '#5a3010' },
  { bg: 'rgba(230,220,255,0.75)', border: 'rgba(160,140,210,0.40)', color: '#3a2860' },
  { bg: 'rgba(210,240,230,0.75)', border: 'rgba(80,170,140,0.40)',  color: '#1a4a38' },
  { bg: 'rgba(255,235,215,0.78)', border: 'rgba(210,140,80,0.40)',  color: '#5a2808' },
  { bg: 'rgba(220,235,255,0.75)', border: 'rgba(100,150,220,0.40)', color: '#1a3060' },
  { bg: 'rgba(240,230,255,0.75)', border: 'rgba(150,120,220,0.40)', color: '#3a1860' },
  { bg: 'rgba(255,248,215,0.80)', border: 'rgba(220,180,60,0.45)',  color: '#5a3800' },
  { bg: 'rgba(215,240,250,0.75)', border: 'rgba(80,170,210,0.40)',  color: '#103848' },
  { bg: 'rgba(228,248,218,0.75)', border: 'rgba(100,180,90,0.40)',  color: '#1a4010' },
  { bg: 'rgba(255,228,232,0.75)', border: 'rgba(210,120,140,0.40)', color: '#5a1830' },
];

const SHAPES = ['shape-circle','shape-squircle','shape-blob1','shape-blob2','shape-blob3'];
const BOBS   = ['bob-a','bob-b','bob-c','bob-d','bob-e','bob-f'];
const SIZES  = ['sz-small','sz-small','sz-medium','sz-medium','sz-large','sz-xlarge'];

const POPUP_MESSAGES = [
  { line1: 'Your moment has been caught.', line2: "It's now floating in the meadow with the others." },
  { line1: 'I see you.', line2: 'Mila whispered. The moment catcher shimmered once more.' },
  { line1: 'Thank you for sharing.', line2: "Your moment is now part of something bigger." },
  { line1: 'Caught. Held. Remembered.', line2: 'The meadow is a little fuller now.' },
  { line1: 'There it is.', line2: 'That small thing you noticed — it matters.' },
  { line1: 'You slowed down.', line2: "That is the whole practice. Well done." },
];

let selectedFile = null;

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

async function submitMoment() {
  const input = document.getElementById('momentInput');
  const text = input.value.trim();
  const hasText = text.length > 0;
  const hasImage = !!selectedFile;

  if (!hasText && !hasImage) {
    showStatus('Please share something — words, an image, or both.', '#b06040');
    return;
  }

  const nameEl = document.getElementById('nameInput');
  const cityEl = document.getElementById('cityInput');
  const firstName = nameEl ? nameEl.value.trim() : '';
  const city = cityEl ? cityEl.value.trim() : '';

  const btn = document.querySelector('.add-btn');
  btn.disabled = true;
  showStatus('catching your moment…', '#8a6a4a');

  try {
    let imageUrl = null;
    if (hasImage) {
      const filename = `${Date.now()}-${selectedFile.name.replace(/\s/g,'_')}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': selectedFile.type, 'x-upsert': 'false' },
        body: selectedFile
      });
      if (up.ok) imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
    }

    const db = await fetch(`${SUPABASE_URL}/rest/v1/moments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ text: hasText ? text : null, image_url: imageUrl, first_name: firstName || null, city: city || null })
    });

    if (!db.ok) throw new Error(await db.text());

    input.value = '';
    if (nameEl) nameEl.value = '';
    if (cityEl) cityEl.value = '';
    clearImage();
    document.getElementById('submitStatus').style.display = 'none';
    showPopup();
    setTimeout(() => { closePopup(); loadMoments(); }, 4000);

  } catch (err) {
    console.error(err);
    showStatus('something went wrong — please try again', '#b06040');
  } finally {
    btn.disabled = false;
  }
}

function showStatus(msg, color) {
  const s = document.getElementById('submitStatus');
  s.style.display = 'block';
  s.style.color = color;
  s.textContent = msg;
}

function showPopup() {
  const popup = document.getElementById('momentPopup');
  if (!popup) return;
  const msg = POPUP_MESSAGES[Math.floor(Math.random() * POPUP_MESSAGES.length)];
  document.getElementById('popupLine1').textContent = msg.line1;
  document.getElementById('popupLine2').textContent = msg.line2;
  popup.style.display = 'flex';
  requestAnimationFrame(() => popup.classList.add('popup-visible'));
}

function closePopup() {
  const popup = document.getElementById('momentPopup');
  if (!popup) return;
  popup.classList.remove('popup-visible');
  setTimeout(() => { popup.style.display = 'none'; }, 400);
}

async function loadMoments() {
  const container = document.getElementById('bubblesContainer');
  if (!container) return;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/moments?approved=eq.true&order=created_at.desc&limit=60`,
      { headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY } }
    );
    if (!res.ok) throw new Error();
    const moments = await res.json();
    container.innerHTML = '';
    if (!moments.length) {
      container.innerHTML = '<div class="loading-state">be the first to share a moment</div>';
      return;
    }
    const shuffled = [...moments].sort(() => Math.random() - 0.5);
    shuffled.forEach((m, i) => container.appendChild(buildBubble(m, i)));
  } catch(err) {
    console.error(err);
    container.innerHTML = '';
    getSeedMoments().forEach((m, i) => container.appendChild(buildBubble(m, i)));
  }
  
  // Reveal bubbles after they're in the DOM
  const bubbles = container.querySelectorAll('.bubble');
  bubbles.forEach((b, i) => {
    setTimeout(() => b.classList.add('visible'), i * 60);
  });

  initHeaderParallax();
}

function initScrollReveal() {}

function buildBubble(moment, index) {
  const palette   = PALETTES[index % PALETTES.length];
  const shape     = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const bob       = BOBS[Math.floor(Math.random() * BOBS.length)];
  const sizeClass = SIZES[Math.floor(Math.random() * SIZES.length)];
  const dur       = (3.5 + Math.random() * 4).toFixed(1) + 's';
  const delay     = (Math.random() * 2).toFixed(1) + 's';

  const wrap = document.createElement('div');
  wrap.className = `bubble ${bob} ${sizeClass}`;
  wrap.style.cssText = `--dur:${dur}; --delay:${delay};`;

  const inner = document.createElement('div');
  inner.className = `bubble-inner ${shape}`;

  const hasText  = !!(moment.text && moment.text.trim());
  const hasImage = !!moment.image_url;
  const type     = hasImage && hasText ? 'combined' : hasImage ? 'image-only' : 'text-only';
  const textLen  = moment.text ? moment.text.length : 0;
  const fontSize = textLen > 120 ? 11 : textLen > 60 ? 13 : 15;

  if (type === 'text-only') {
    inner.classList.add('tinted');
    inner.style.background = palette.bg;
    inner.style.border = `1px solid ${palette.border}`;
    const p = document.createElement('p');
    p.className = 'bubble-text';
    p.style.cssText = `color:${palette.color}; font-size:${fontSize}px;`;
    p.textContent = moment.text;
    inner.appendChild(p);

  } else if (type === 'image-only') {
    inner.classList.add('img-fill');
    const img = document.createElement('img');
    img.src = moment.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);

  } else {
    inner.classList.add('img-fill');
    const img = document.createElement('img');
    img.src = moment.image_url;
    img.alt = 'moment';
    img.loading = 'lazy';
    inner.appendChild(img);
    const veil = document.createElement('div');
    veil.className = 'bubble-veil';
    inner.appendChild(veil);
    const p = document.createElement('p');
    p.className = 'bubble-text overlay-text';
    p.style.fontSize = fontSize + 'px';
    p.textContent = moment.text;
    inner.appendChild(p);
  }

  wrap.appendChild(inner);

  if (moment.created_at) {
    const meta = document.createElement('div');
    meta.className = 'bubble-meta';
    meta.textContent = formatMeta(moment);
    wrap.appendChild(meta);
  }

  return wrap;
}

function initHeaderParallax() {
  const topSection = document.querySelector('.top-section');
  if (!topSection) return;
  let ticking = false;
  let userIsTyping = false;

  document.querySelectorAll('.moment-input, .optional-input, #imageInput').forEach(el => {
    el.addEventListener('focus', () => { userIsTyping = true; });
    el.addEventListener('blur', () => {
      setTimeout(() => { userIsTyping = false; }, 1500);
    });
  });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (!userIsTyping) {
          const scrollY = window.scrollY;
          topSection.style.transform = `translateY(${scrollY * 0.2}px)`;
          topSection.style.opacity = Math.max(0, 1 - scrollY * 0.0015);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initScrollReveal() {
  document.querySelectorAll('.bubble').forEach((b, i) => {
    setTimeout(() => b.classList.add('visible'), i * 60);
  });
}
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Array.from(bubbles).indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, (idx % 4) * 80);
      }
    });
  }, { threshold: 0.01, rootMargin: '50px' });

  bubbles.forEach(b => observer.observe(b));

  // Safety fallback — if bubbles still invisible after 1.5s, show them all
  setTimeout(() => {
    bubbles.forEach((b, i) => {
      if (!b.classList.contains('visible')) {
        setTimeout(() => b.classList.add('visible'), i * 40);
      }
    });
  }, 1500);
}
function formatMeta(moment) {
  const createdAt = moment.created_at;
  let time = '';
  if (createdAt) {
    const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
    if (diff < 60)          time = 'just now';
    else if (diff < 3600)   time = `${Math.floor(diff/60)}m ago`;
    else if (diff < 86400)  time = `${Math.floor(diff/3600)}h ago`;
    else if (diff < 604800) time = `${Math.floor(diff/86400)} days ago`;
    else time = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const parts = [time];
  if (moment.first_name || moment.city) {
    const who = [moment.first_name, moment.city].filter(Boolean).join(', ');
    parts.push(who);
  }
  return parts.filter(Boolean).join(' · ');
}

function getSeedMoments() {
  return [
    { text: 'the way coffee steam bent sideways when the window opened', created_at: new Date(Date.now()-3600000).toISOString() },
    { text: 'I noticed the light was already different. Still summer but the angle had shifted.', created_at: new Date(Date.now()-86400000).toISOString() },
    { text: 'a stranger held the door so long I had to jog', created_at: new Date(Date.now()-172800000).toISOString() },
    { text: 'my dog sniffed the same patch of sidewalk for two full minutes. I let her.', created_at: new Date(Date.now()-259200000).toISOString() },
    { text: 'floating', created_at: new Date(Date.now()-300000).toISOString() },
    { text: 'the smell of rain before it started. that five-second window.', created_at: new Date(Date.now()-345600000).toISOString() },
    { text: 'she covered her mouth when she laughed. I\'d never noticed before.', created_at: new Date(Date.now()-432000000).toISOString() },
    { text: 'tiny handprints in the bus window fog', created_at: new Date(Date.now()-518400000).toISOString() },
    { text: 'two pigeons sharing a chip. one waited.', created_at: new Date(Date.now()-604800000).toISOString() },
    { text: 'holding my breath every time I open email. still working on it.', created_at: new Date(Date.now()-691200000).toISOString() },
  ];
}

document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('momentPopup');
  if (popup) popup.style.display = 'none';

  document.getElementById('momentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitMoment(); }
  });
  loadMoments();
});
