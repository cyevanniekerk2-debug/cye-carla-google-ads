
document.addEventListener('pointermove', (e)=>{
  document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
  document.documentElement.style.setProperty('--my', `${e.clientY}px`);
});
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting)e.target.classList.add('reveal-in'); });
},{threshold:.12});
document.querySelectorAll('section, .service-tile, .website-card, .package-card').forEach(el=>{
  el.classList.add('reveal');
  observer.observe(el);
});
