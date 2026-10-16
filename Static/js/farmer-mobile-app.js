document.addEventListener('DOMContentLoaded',function(){
 const drawer=document.getElementById('mobileSidebar');
 const bottom=document.querySelector('.agri-bottom-nav');
 if(!drawer||!bottom)return;
 const links=[...document.querySelectorAll('.sidebar [data-section],#mobileSidebar [data-section],.agri-bottom-nav [data-section]')];
 function highlight(id){links.forEach(link=>{const active=link.dataset.section===id;link.classList.toggle('active',active);if(link.closest('.agri-bottom-nav'))link.setAttribute('aria-current',active?'page':'false')})}
 bottom.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',function(){
   const id=button.dataset.section,target=document.getElementById(id);
   if(!target)return;
   document.querySelectorAll('.main-content .content-section').forEach(section=>section.style.display='none');
   target.style.display='block';highlight(id);window.scrollTo({top:0,behavior:'smooth'});
 }));
 const more=document.getElementById('agri-bottom-more');
 if(more)more.addEventListener('click',function(){if(window.bootstrap&&bootstrap.Offcanvas)bootstrap.Offcanvas.getOrCreateInstance(drawer).show()});
 drawer.querySelectorAll('[data-section]').forEach(link=>link.addEventListener('click',()=>highlight(link.dataset.section)));
 const search=document.getElementById('agri-nav-search');
 if(search)search.addEventListener('input',function(){const term=search.value.trim().toLowerCase();drawer.querySelectorAll('.nav-item,.nav > a[data-section]').forEach(item=>item.hidden=!item.textContent.toLowerCase().includes(term))});
 highlight('home');
});