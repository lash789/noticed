document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const current = window.location.pathname;

  const igSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stop-color="#fdf497"/>
        <stop offset="5%" stop-color="#fdf497"/>
        <stop offset="45%" stop-color="#fd5949"/>
        <stop offset="60%" stop-color="#d6249f"/>
        <stop offset="90%" stop-color="#285AEB"/>
      </radialGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="url(#ig-grad)"/>
    <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="none" stroke="none"/>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" stroke-width="1.6"/>
    <circle cx="17.5" cy="6.5" r="1.1" fill="white"/>
  </svg>`;

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="/" class="nav-logo">The Moment Catcher</a>
      <div class="nav-links">
        <a href="/" class="${current === '/' || current === '/index.html' ? 'active' : ''}">Home</a>
        <a href="/about.html" class="${current.includes('about') ? 'active' : ''}">About</a>
        <a href="/blog.html" class="${current.includes('blog') ? 'active' : ''}">Blog</a>
        <a href="https://www.amazon.com/dp/B0GY5KK8Y3" target="_blank" class="nav-book">Get the Book</a>
        <a href="https://www.instagram.com/themomentcatcher_com" target="_blank" class="nav-ig" aria-label="Instagram">${igSvg}</a>
      </div>
    </div>
  `;
});
