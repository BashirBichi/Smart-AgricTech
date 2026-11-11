document.addEventListener('DOMContentLoaded',()=>{'use strict';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(Number(v||0));
const today=()=>new Date().toISOString().slice(0,10);
const main=document.querySelector('.dashboard-container .main-content');
if(!main)return;

document.querySelectorAll('input[type=date]').forEach(i=>{if(!i.value)i.value=today()});

async function api(url,options={}){
  const res=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  let data={};try{data=await res.json()}catch{}
  if(!res.ok)throw Error(data.error||'Request failed');
  return data;
}
function setStatus(id,message,ok=false){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=message;el.className='form-status '+(ok?'success':'error');
}
function hideSections(){
  main.querySelectorAll('.content-section').forEach(s=>s.style.display='none');
}
function setActive(id){
  document.querySelectorAll('[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===id));
}
function navigate(id){
  const target=document.getElementById(id);
  if(!target)return false;
  hideSections();target.style.display='block';setActive(id);
  if(id==='buyer-inquiries')loadCustomers();
  if(id==='business-overview'||id==='business-finance'||id==='home')loadSummary();
  if(id==='product-listings'||id==='market-trends')loadProducts();
  if(id==='invoices')loadInvoices();
  if(id==='receipts')loadReceipts();
  if(id==='payroll')loadPayroll();
  if(id==='waybills')loadWaybills();
  if(id==='business-profile')loadBusinessProfile();
  if(id==='Community-support'){/* community-hub owns its data */ }
  window.scrollTo({top:0,behavior:'smooth'});
  return true;
}

const accountSections=new Set(['view-profile','edit-profile','settings','my-wallet','logout']);
document.addEventListener('click',e=>{
  const target=e.target.closest('[data-section]');if(!target)return;
  const id=target.dataset.section;
  if(accountSections.has(id)||id==='workspace-insights')return;
  if(!document.getElementById(id))return;
  e.preventDefault();e.stopImmediatePropagation();
  navigate(id);
  const drawer=document.getElementById('marketerMobileSidebar');
  if(drawer&&window.bootstrap?.Offcanvas)window.bootstrap.Offcanvas.getInstance(drawer)?.hide();
},true);

document.getElementById('marketer-bottom-more')?.addEventListener('click',()=>{
  const drawer=document.getElementById('marketerMobileSidebar');
  if(drawer&&window.bootstrap?.Offcanvas)window.bootstrap.Offcanvas.getOrCreateInstance(drawer).show();
});
document.getElementById('marketer-nav-search')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll('#marketerMobileSidebar .nav-item').forEach(item=>{item.hidden=!item.textContent.toLowerCase().includes(q)});
});

async function loadSummary(){
  try{
    const d=await api('/api/marketer/business/summary');
    const kpis=[
      ['Products listed',d.listings,'fa-boxes-stacked'],
      ['Invoices',d.invoices,'fa-file-invoice-dollar'],
      ['Collected',money(d.collected),'fa-money-bill-transfer'],
      ['Outstanding',money(d.outstanding),'fa-hourglass-half'],
      ['Pending delivery',d.pending_waybills,'fa-truck-fast']
    ];
    const html=kpis.map(([label,value,icon])=>'<article class="mk-kpi"><span class="kpi-icon"><i class="fas '+icon+'"></i></span><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></article>').join('');
    ['home-kpis','overview-kpis','finance-kpis'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html});
    const status=document.getElementById('overview-status');
    if(status)status.innerHTML=[
      ['Invoiced',money(d.invoiced)],['Collected',money(d.collected)],['Outstanding',money(d.outstanding)],
      ['Payroll due',money(d.payroll_due)],['Employees',d.employees],['Waybills',d.waybills]
    ].map(x=>'<div class="status-item"><span>'+esc(x[0])+'</span><strong class="status-value">'+esc(x[1])+'</strong></div>').join('');
    const profile=await api('/api/marketer/business/profile');
    const hp=document.getElementById('home-business-profile');
    if(hp)hp.innerHTML=profile.business_name
      ?'<strong>'+esc(profile.business_name)+'</strong><div class="mt-2"><small>'+esc(profile.phone||'Phone not set')+'</small><br><small>'+esc(profile.address||'Address not set')+'</small></div>'
      :'<div class="empty-state">Set your business name, phone and address before issuing business documents.</div>';
  }catch(e){console.error('Marketer summary:',e)}
}

async function loadBusinessProfile(){
  const form=document.getElementById('business-profile-form');if(!form)return;
  try{
    const d=await api('/api/marketer/business/profile');
    form.elements.business_name.value=d.business_name||'';
    form.elements.phone.value=d.phone||'';
    form.elements.address.value=d.address||'';
    form.elements.tax_id.value=d.tax_id||'';
  }catch(e){setStatus('business-profile-status',e.message)}
}

async function loadProducts(){
  const d=await api('/api/marketer/products');
  const list=document.getElementById('product-list'),count=document.getElementById('product-count'),prices=document.getElementById('market-price-list');
  if(count)count.textContent=d.products.length+' active listing'+(d.products.length===1?'':'s');
  if(list)list.innerHTML=d.products.length?d.products.map(p=>'<article class="record-card"><div class="record-card-main"><strong>'+esc(p.name)+'</strong><small>'+esc(p.description||'No description')+' · Qty '+Number(p.quantity).toLocaleString()+'</small></div><span class="record-card-price">'+money(p.price)+'</span><div class="record-card-actions"><button type="button" data-print-product="'+p.id+'" aria-label="Print product"><i class="fas fa-print"></i></button><button type="button" data-delete-product="'+p.id+'" aria-label="Remove product"><i class="fas fa-trash"></i></button></div></article>').join(''):'<div class="empty-state">No products listed yet.</div>';
  if(prices)prices.innerHTML=d.products.length?d.products.slice(0,9).map(p=>'<div class="price-card"><strong>'+esc(p.name)+'</strong><span>'+money(p.price)+'</span><small>'+Number(p.quantity).toLocaleString()+' units listed</small></div>').join(''):'<div class="empty-state">No pricing records available.</div>';
}

document.getElementById('marketer-product-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,button=form.querySelector('button[type=submit]');button.disabled=true;setStatus('product-form-status','Publishing...',true);
  try{const d=await api('/api/marketer/products',{method:'POST',body:new FormData(form)});setStatus('product-form-status',d.message||'Product published.',true);form.reset();await Promise.all([loadProducts(),loadSummary()])}
  catch(err){setStatus('product-form-status',err.message)}finally{button.disabled=false}
});
document.getElementById('product-list')?.addEventListener('click',async e=>{
  const del=e.target.closest('[data-delete-product]');if(del){if(!confirm('Remove this product listing?'))return;try{await api('/api/marketer/products/'+del.dataset.deleteProduct,{method:'DELETE'});await Promise.all([loadProducts(),loadSummary()])}catch(err){alert(err.message)}return}
  const print=e.target.closest('[data-print-product]');if(print){const p=(await api('/api/marketer/products')).products.find(x=>String(x.id)===print.dataset.printProduct);if(p)printDocument('Product Listing',productDocument(p))}
});

async function loadInvoices(){
  const d=await api('/api/marketer/business/invoices'),body=document.getElementById('invoice-table');if(!body)return;
  body.innerHTML=d.invoices.length?d.invoices.map(x=>'<tr><td><strong>'+esc(x.invoice_number)+'</strong></td><td>'+esc(x.customer_name)+'</td><td>'+money(x.total)+'</td><td><span class="status-pill '+esc(x.status)+'">'+esc(x.status.replace('_',' '))+'</span></td><td>'+esc(x.due_date||'No due date')+'</td><td class="record-actions"><button type="button" data-print-invoice="'+x.id+'" aria-label="Print invoice"><i class="fas fa-print"></i></button><button type="button" data-delete-invoice="'+x.id+'" aria-label="Delete invoice"><i class="fas fa-trash"></i></button></td></tr>').join(''):'<tr><td colspan="6">No invoices recorded.</td></tr>';
}
async function loadReceipts(){
  const d=await api('/api/marketer/business/receipts'),body=document.getElementById('receipt-table');if(!body)return;
  body.innerHTML=d.receipts.length?d.receipts.map(x=>'<tr><td><strong>'+esc(x.receipt_number)+'</strong></td><td>'+esc(x.customer_name)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.payment_method)+'</td><td>'+esc(x.received_on)+'</td><td class="record-actions"><button type="button" data-print-receipt="'+x.id+'" aria-label="Print receipt"><i class="fas fa-print"></i></button><button type="button" data-delete-receipt="'+x.id+'" aria-label="Delete receipt"><i class="fas fa-trash"></i></button></td></tr>').join(''):'<tr><td colspan="6">No receipts recorded.</td></tr>';
}
async function loadPayroll(){
  const d=await api('/api/marketer/business/payroll'),body=document.getElementById('payroll-table');if(!body)return;
  body.innerHTML=d.payroll.length?d.payroll.map(x=>'<tr><td><strong>'+esc(x.employee_name)+'</strong><br><small>'+esc(x.role_title||'Staff')+'</small></td><td>'+esc(x.pay_period)+'</td><td>'+money(x.net_pay)+'</td><td><span class="status-pill '+esc(x.status)+'">'+esc(x.status)+'</span></td><td class="record-actions"><button type="button" data-print-payroll="'+x.id+'" aria-label="Print payroll"><i class="fas fa-print"></i></button><button type="button" data-delete-payroll="'+x.id+'" aria-label="Delete payroll"><i class="fas fa-trash"></i></button></td></tr>').join(''):'<tr><td colspan="5">No payroll records recorded.</td></tr>';
}
async function loadWaybills(){
  const d=await api('/api/marketer/business/waybills'),body=document.getElementById('waybill-table');if(!body)return;
  body.innerHTML=d.waybills.length?d.waybills.map(x=>'<tr><td><strong>'+esc(x.waybill_number)+'</strong></td><td>'+esc(x.customer_name)+'</td><td>'+esc(x.origin)+' → '+esc(x.destination)+'</td><td><span class="status-pill '+esc(x.status)+'">'+esc(x.status.replace('_',' '))+'</span></td><td>'+esc(x.dispatch_date)+'</td><td class="record-actions"><button type="button" data-print-waybill="'+x.id+'" aria-label="Print waybill"><i class="fas fa-print"></i></button><button type="button" data-delete-waybill="'+x.id+'" aria-label="Delete waybill"><i class="fas fa-trash"></i></button></td></tr>').join(''):'<tr><td colspan="6">No waybills recorded.</td></tr>';
}
async function loadCustomers(){
  try{
    const [inv,rec]=await Promise.all([api('/api/marketer/business/invoices'),api('/api/marketer/business/receipts')]);
    const map=new Map();
    inv.invoices.forEach(x=>{const k=x.customer_name.trim().toLowerCase();const v=map.get(k)||{name:x.customer_name,invoices:0,payments:0,value:0,last:x.issue_date};v.invoices++;v.value+=Number(x.total||0);v.last=x.issue_date>v.last?x.issue_date:v.last;map.set(k,v)});
    rec.receipts.forEach(x=>{const k=x.customer_name.trim().toLowerCase();const v=map.get(k)||{name:x.customer_name,invoices:0,payments:0,value:0,last:x.received_on};v.payments+=Number(x.amount||0);v.last=x.received_on>v.last?x.received_on:v.last;map.set(k,v)});
    const rows=[...map.values()].sort((a,b)=>b.value-a.value),table=document.getElementById('customer-table'),kpi=document.getElementById('customer-kpis');
    if(kpi)kpi.innerHTML=[['Customers',rows.length,'fa-users'],['Invoice value',money(rows.reduce((s,x)=>s+x.value,0)),'fa-file-invoice-dollar'],['Collected',money(rec.receipts.reduce((s,x)=>s+Number(x.amount||0),0)),'fa-money-bill-wave'],['Invoices',inv.invoices.length,'fa-receipt']].map(([a,b,i])=>'<article class="mk-kpi"><span class="kpi-icon"><i class="fas '+i+'"></i></span><small>'+a+'</small><strong>'+esc(b)+'</strong></article>').join('');
    if(table)table.innerHTML=rows.length?rows.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong></td><td>'+x.invoices+'</td><td>'+money(x.payments)+'</td><td>'+money(x.value)+'</td><td>'+esc(x.last)+'</td></tr>').join(''):'<tr><td colspan="5">No customers yet. Create your first invoice to start the customer register.</td></tr>';
  }catch(e){const table=document.getElementById('customer-table');if(table)table.innerHTML='<tr><td colspan="5">'+esc(e.message)+'</td></tr>'}
}

function submitJson(form,url,statusId,after){
  if(!form)return;
  form.addEventListener('submit',async e=>{
    e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;setStatus(statusId,'Saving...',true);
    try{const data=Object.fromEntries(new FormData(form).entries());const d=await api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});setStatus(statusId,d.message||'Saved successfully.',true);form.reset();document.querySelectorAll('input[type=date]').forEach(i=>{if(!i.value)i.value=today()});await after?.()}
    catch(err){setStatus(statusId,err.message)}finally{button.disabled=false}
  });
}
submitJson(document.getElementById('invoice-form'),'/api/marketer/business/invoices','invoice-form-status',async()=>{await Promise.all([loadInvoices(),loadSummary(),loadCustomers()])});
submitJson(document.getElementById('receipt-form'),'/api/marketer/business/receipts','receipt-form-status',async()=>{await Promise.all([loadReceipts(),loadSummary(),loadCustomers()])});
submitJson(document.getElementById('payroll-form'),'/api/marketer/business/payroll','payroll-form-status',async()=>{await Promise.all([loadPayroll(),loadSummary()])});
submitJson(document.getElementById('waybill-form'),'/api/marketer/business/waybills','waybill-form-status',async()=>{await Promise.all([loadWaybills(),loadSummary()])});
submitJson(document.getElementById('business-profile-form'),'/api/marketer/business/profile','business-profile-status',async()=>{await loadSummary()});

function productDocument(p){return '<h1>Product Listing</h1><div class="doc-meta"><strong>'+esc(p.name)+'</strong><span>Price: '+money(p.price)+'</span><span>Quantity: '+Number(p.quantity).toLocaleString()+'</span></div><p>'+esc(p.description||'No description')+'</p>'}
function invoiceDocument(x){return '<h1>INVOICE</h1><div class="doc-meta"><span><strong>Invoice:</strong> '+esc(x.invoice_number)+'</span><span><strong>Customer:</strong> '+esc(x.customer_name)+'</span><span><strong>Issue date:</strong> '+esc(x.issue_date)+'</span><span><strong>Due date:</strong> '+esc(x.due_date||'Not specified')+'</span></div><table><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr><tr><td>'+esc(x.item_summary)+'</td><td>'+x.quantity+'</td><td>'+money(x.unit_price)+'</td><td>'+money(x.total)+'</td></tr></table><h2>Total: '+money(x.total)+'</h2><p>Status: '+esc(x.status)+'</p><p>'+esc(x.notes||'')+'</p>'}
function receiptDocument(x){return '<h1>RECEIPT</h1><div class="doc-meta"><span><strong>Receipt:</strong> '+esc(x.receipt_number)+'</span><span><strong>Customer:</strong> '+esc(x.customer_name)+'</span><span><strong>Date:</strong> '+esc(x.received_on)+'</span><span><strong>Method:</strong> '+esc(x.payment_method)+'</span></div><h2>Amount received: '+money(x.amount)+'</h2><p>Invoice reference: '+esc(x.invoice_number||'Not specified')+'</p><p>'+esc(x.notes||'')+'</p>'}
function payrollDocument(x){return '<h1>PAYROLL RECORD</h1><div class="doc-meta"><span><strong>Employee:</strong> '+esc(x.employee_name)+'</span><span><strong>Role:</strong> '+esc(x.role_title||'Staff')+'</span><span><strong>Pay period:</strong> '+esc(x.pay_period)+'</span></div><table><tr><th>Basic salary</th><th>Allowances</th><th>Deductions</th><th>Net pay</th></tr><tr><td>'+money(x.basic_salary)+'</td><td>'+money(x.allowances)+'</td><td>'+money(x.deductions)+'</td><td>'+money(x.net_pay)+'</td></tr></table><p>Status: '+esc(x.status)+'</p>'}
function waybillDocument(x){return '<h1>WAYBILL</h1><div class="doc-meta"><span><strong>Waybill:</strong> '+esc(x.waybill_number)+'</span><span><strong>Customer:</strong> '+esc(x.customer_name)+'</span><span><strong>Route:</strong> '+esc(x.origin)+' → '+esc(x.destination)+'</span><span><strong>Dispatch:</strong> '+esc(x.dispatch_date)+'</span><span><strong>Vehicle:</strong> '+esc(x.vehicle||'Not specified')+'</span><span><strong>Driver:</strong> '+esc(x.driver||'Not specified')+'</span></div><p><strong>Shipment:</strong><br>'+esc(x.items_summary)+'</p><p>Status: '+esc(x.status)+'</p><p>'+esc(x.notes||'')+'</p>'}
function printDocument(title,body){
  const w=window.open('','_blank','noopener,noreferrer,width=900,height=700');if(!w){alert('Allow pop-ups to print this document.');return}
  w.document.write('<!doctype html><html><head><title>'+esc(title)+'</title><style>body{font:14px Arial,sans-serif;color:#17392d;padding:40px;max-width:900px;margin:auto}h1{font-size:25px;border-bottom:2px solid #2d8756;padding-bottom:10px}h2{margin-top:25px}.doc-meta{display:grid;gap:7px;background:#f1f7f1;padding:16px;border-radius:10px;margin:18px 0}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #dce8df;padding:10px;text-align:left}th{background:#eef6ed}@media print{body{padding:15px}}</style></head><body>'+body+'</body></html>');
  w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
async function handleRecordAction(e){
  const b=e.target.closest('button');if(!b)return;
  const config=[
    ['data-delete-invoice','/api/marketer/business/invoices/','Invoice deleted',loadInvoices],
    ['data-delete-receipt','/api/marketer/business/receipts/','Receipt deleted',loadReceipts],
    ['data-delete-payroll','/api/marketer/business/payroll/','Payroll record deleted',loadPayroll],
    ['data-delete-waybill','/api/marketer/business/waybills/','Waybill deleted',loadWaybills]
  ];
  for(const [attr,url,msg,reload] of config){
    if(b.hasAttribute(attr)){if(!confirm('Delete this record?'))return;try{await api(url+b.getAttribute(attr),{method:'DELETE'});await Promise.all([reload(),loadSummary()]);if(attr==='data-delete-invoice'||attr==='data-delete-receipt')await loadCustomers()}catch(err){alert(err.message)}return}
  }
  const printConfig=[
    ['data-print-invoice','/api/marketer/business/invoices/',invoiceDocument],
    ['data-print-receipt','/api/marketer/business/receipts/',receiptDocument],
    ['data-print-payroll','/api/marketer/business/payroll/',payrollDocument],
    ['data-print-waybill','/api/marketer/business/waybills/',waybillDocument]
  ];
  for(const [attr,url,doc] of printConfig){
    if(b.hasAttribute(attr)){
      try{
        const d=await api(url);
        const key=Object.keys(d)[0];
        const row=(d[key]||[]).find(x=>String(x.id)===b.getAttribute(attr));
        if(!row)throw Error('Record not found');
        printDocument(key,doc(row));
      }catch(err){alert('Document data could not be loaded: '+err.message)}
      return
    }
  }
}
document.getElementById('invoice-table')?.addEventListener('click',handleRecordAction);
document.getElementById('receipt-table')?.addEventListener('click',handleRecordAction);
document.getElementById('payroll-table')?.addEventListener('click',handleRecordAction);
document.getElementById('waybill-table')?.addEventListener('click',handleRecordAction);

loadSummary();
loadProducts();
});