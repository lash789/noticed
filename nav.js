// Shared navigation — injected into every page
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const current = window.location.pathname;
  nav.innerHTML = `
    <div class="nav-inner">
      <a href="/" class="nav-logo">The Moment Catcher</a>
      <div class="nav-links">
        <a href="/" class="${current === '/' ? 'active' : ''}">Home</a>
        <a href="/about.html" class="${current.includes('about') ? 'active' : ''}">About</a>
        <a href="/blog.html" class="${current.includes('blog') ? 'active' : ''}">Blog</a>
        <a href="https://www.amazon.com/dp/B0GY5KK8Y3" target="_blank" class="nav-book">Get the Book</a>
        <a href="https://www.instagram.com/themomentcatcher_com" target="_blank" class="nav-ig" aria-label="Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        </a>
      </div>
    </div>
  `;
});
