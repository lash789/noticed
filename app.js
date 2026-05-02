// ─── Config ──────────────────────────────────────────────
// Replace these with your actual Supabase values after setup
const SUPABASE_URL = 'https://wkvtkcuoohiawiewqoao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdnRrY3Vvb2hpYXdpZXdxb2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTI1MDMsImV4cCI6MjA5MzMyODUwM30.aGqkmaiVe-oH6lyxdtC9joLI-ciPjVF0nJHTYa7XSS8';
const BUCKET_NAME = 'moment-images';

// ─── State ───────────────────────────────────────────────
let selectedFile = null;

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
  btn.textContent = 'adding…';
  status.style.display = 'block';
  status.textContent = 'saving your moment…';

  try {
    let imageUrl = null;

    // Upload image if one was selected
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

    // Save moment to database
    const momentData = {
      text: text,
      image_url: imageUrl,
      approved: false  // goes into moderation queue
    };

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/moments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(momentData)
    });

    if (!dbRes.ok) throw new Error('Failed to save moment');

    // Success
    input.value = '';
    clearImage();
    status.textContent = '✓ your moment was added — it\'ll appear once we\'ve read it';
    setTimeout(() => { status.style.display = 'none'; }, 4000);

  } catch (err) {
    console.error(err);
    status.textContent = 'something went wrong — please try again';
    status.style.color = '#c07060';
  } finally {
    btn.disabled = false;
    btn.textContent = 'add it';
  }
}

// ─── Load approved moments ────────────────────────────────
async function loadMoments() {
  const mosaic = document.getElementById('mosaic');

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

    if (!res.ok) throw new Error('Could not load moments');
    const moments = await res.json();

    mosaic.innerHTML = '';

    if (moments.length === 0) {
      mosaic.innerHTML = '<div class="loading-state">be the first to add a moment</div>';
      return;
    }

    moments.forEach((m, i) => {
      const card = buildCard(m, i);
      mosaic.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    // Show seed moments as fallback so the page never feels empty
    mosaic.innerHTML = '';
    getSeedMoments().forEach((m, i) => {
      mosaic.appendChild(buildCard(m, i));
    });
  }
}

// ─── Build a card element ─────────────────────────────────
function buildCard(moment, index) {
  const card = document.createElement('div');
  const styles = ['warm', 'cool', 'cream'];
  const style = styles[index % styles.length];
  card.className = `moment-card ${style}`;
  card.style.animationDelay = `${index * 0.05}s`;

  const hasImage = moment.image_url;
  const textLen = moment.text.length;
  const textSize = textLen < 60 ? 'large' : textLen > 180 ? 'small' : '';

  if (hasImage) card.classList.add('image-card');

  let html = '';

  if (hasImage) {
    const imgHeight = 120 + Math.floor(Math.random() * 100);
    html += `<img class="moment-img" src="${escapeHtml(moment.image_url)}" alt="moment image" style="height:${imgHeight}px" loading="lazy">`;
  }

  html += `<div class="moment-body">`;
  html += `<p class="moment-text ${textSize}">${escapeHtml(moment.text)}</p>`;

  const meta = formatMeta(moment.created_at, moment.location);
  html += `<div class="moment-meta">${meta}</div>`;
  html += `</div>`;

  card.innerHTML = html;
  return card;
}

// ─── Helpers ──────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMeta(createdAt, location) {
  const parts = [];
  if (createdAt) {
    const date = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) parts.push('just now');
    else if (diff < 3600) parts.push(`${Math.floor(diff / 60)}m ago`);
    else if (diff < 86400) parts.push(`${Math.floor(diff / 3600)}h ago`);
    else if (diff < 604800) parts.push(`${Math.floor(diff / 86400)} days ago`);
    else parts.push(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }
  if (location) parts.push(location);
  return parts.join(' · ');
}

// Seed moments shown when Supabase isn't connected yet
function getSeedMoments() {
  return [
    { text: 'the way the coffee steam bent sideways when the window opened just slightly', created_at: new Date(Date.now() - 3600000).toISOString() },
    { text: 'I noticed the light was already different. Still summer but somehow the angle had shifted.', created_at: new Date(Date.now() - 86400000).toISOString() },
    { text: '"she said thank you so quietly I almost missed it" — the cashier at the corner shop', created_at: new Date(Date.now() - 172800000).toISOString() },
    { text: 'my dog stopped and sniffed the same patch of sidewalk for nearly two full minutes. I let her.', created_at: new Date(Date.now() - 259200000).toISOString() },
    { text: 'a stranger held the door open so long I had to slightly jog', created_at: new Date(Date.now() - 345600000).toISOString() },
    { text: 'the kid on the bus who kept touching the window, leaving tiny handprints in the fog', created_at: new Date(Date.now() - 432000000).toISOString() },
    { text: 'my grandmother laughed at something I said and I realized I\'d never noticed she covers her mouth when she does', created_at: new Date(Date.now() - 518400000).toISOString() },
    { text: 'I noticed I\'ve been holding my breath slightly every time I open my email. Still trying to stop.', created_at: new Date(Date.now() - 604800000).toISOString() },
    { text: 'the smell of rain before it actually started. That maybe five-second window.', created_at: new Date(Date.now() - 691200000).toISOString() },
  ];
}

// ─── Keyboard shortcut ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('momentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitMoment();
    }
  });

  loadMoments();
});
