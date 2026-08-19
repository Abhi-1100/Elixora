const $ = (selector) => document.querySelector(selector);
const modal = $('#modal');
const openModal = () => { modal.hidden = false; setTimeout(() => $('#idea').focus(), 50); };
const closeModal = () => { modal.hidden = true; };

$('#startButton').addEventListener('click', openModal);
$('#tryButton').addEventListener('click', openModal);
$('#closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeModal(); $('#popover').hidden = true; } });

const popover = $('#popover');
document.querySelectorAll('.nav-trigger').forEach((button) => button.addEventListener('click', () => {
  popover.hidden = !popover.hidden;
  popover.querySelector('p').textContent = button.dataset.menu;
}));

$('.mobile-menu').addEventListener('click', () => {
  const header = $('.site-header'); const expanded = header.classList.toggle('open');
  $('.mobile-menu').setAttribute('aria-expanded', expanded);
});

const toast = $('#toast');
const showToast = () => { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); };
$('#createButton').addEventListener('click', () => { closeModal(); showToast(); });
$('#playButton').addEventListener('click', showToast);
$('#exploreButton').addEventListener('click', () => $('#design').scrollIntoView({ behavior: 'smooth' }));
