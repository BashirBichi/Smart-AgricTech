/* Uniform viewport-aware section behavior for all dashboard roles.
   Enhances presentation only; original controls and navigation remain untouched. */
(function(){
 function init(){
  const main=document.querySelector('.dashboard-container .main-content');if(!main)return;
  const sections=[...main.querySelectorAll('.content-section')].filter(s=>s.id);
  const sectionIds=new Set(sections.map(s=>s.id));
  const nav=[...document.querySelectorAll('[data-section]')].filter(a=>sectionIds.has(a.getAttribute('data-section')));
  function decorate(s){
   s.classList.add('agri-viewport-section');
   const children=[...s.children];
   const forms=[...s.querySelectorAll('form')];
   forms.forEach(form=>{
    const direct=[...form.children];
    const last=direct.filter(e=>e.matches('button[type=submit],input[type=submit],.btn[type=submit],.d-flex,.text-center,.form-actions,.button-group')).at(-1);
    if(last&& (last.matches('button[type=submit],input[type=submit],.btn[type=submit]')||last.querySelector('button[type=submit],input[type=submit]'))){last.classList.add('agri-section-actions');}
   });
   const tail=children.filter(e=>e.matches('button,.btn,.d-flex,.text-center,.button-group,.form-actions')).at(-1);
   if(tail&&(tail.matches('button,.btn')||tail.querySelector('button,.btn'))){tail.classList.add('agri-section-actions');}
  }
  sections.forEach(decorate);
  function sync(){
   const active=sections.filter(s=>{const st=getComputedStyle(s);return st.display!=='none'&&st.visibility!=='hidden'&&s.getClientRects().length>0;});
   sections.forEach(s=>s.classList.toggle('agri-active-section',active.includes(s)));
   active.forEach(s=>{if(s.dataset.agriLastActive!=='true'){s.scrollTop=0;s.dataset.agriLastActive='true';} });
   sections.filter(s=>!active.includes(s)).forEach(s=>{s.dataset.agriLastActive='false';});
  }
  nav.forEach(a=>a.addEventListener('click',()=>requestAnimationFrame(sync)));
  const observer=new MutationObserver(()=>requestAnimationFrame(sync));
  sections.forEach(s=>observer.observe(s,{attributes:true,attributeFilter:['style','class','hidden']}));
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
