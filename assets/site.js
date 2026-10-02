
const track = document.querySelector('.package-track');
document.querySelector('.next')?.addEventListener('click', () => track.scrollBy({left: 400, behavior:'smooth'}));
document.querySelector('.prev')?.addEventListener('click', () => track.scrollBy({left:-400, behavior:'smooth'}));
