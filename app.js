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

let selectedFile = null;

function rng(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

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
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ text: hasText ? text : null, image_url: imageUrl, first_name: firstName || null, city: city || null })
    });

    if (!db.ok) throw new Error(await db.text());

    input.value = '';
    if (name​​​​​​​​​​​​​​​​
