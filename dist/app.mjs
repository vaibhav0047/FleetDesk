import {plan,seedCities} from './engine.mjs'
const $ = id => document.getElementById(id)
const storageKey = 'fleetdesk-workspaces-v1'
const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value)
const num = value => value.toLocaleString('en-IN')
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
let cities
try { cities = JSON.parse(localStorage.getItem(storageKey)) } catch {}
if (!Array.isArray(cities) || !cities.length) cities = seedCities()
let index = 0
let field = false
const current = () => cities[index]

function notify(message){$('notice').textContent=message}
function save(message=''){
  try {localStorage.setItem(storageKey, JSON.stringify(cities));notify(message)}
  catch {notify('Changes are available for this session. Browser storage is unavailable.')}
  render()
}
function options(){
  $('city').replaceChildren(...cities.map((c,i)=>new Option(c.name,i)),new Option('Add new city…','new'))
  $('city').value=String(index)
}
function metric(label,value,detail){
  return '<div class="metric"><label>'+label+'</label><strong>'+value+'</strong><small>'+detail+'</small></div>'
}
function capacityRow(r,target){
  const unit=r.gap===1?r.singular:r.unit
  return `<div class="row"><div class="rowhead"><b>${r.name}</b><div class="step"><button data-key="${r.key}" data-delta="-1" aria-label="Remove one ${r.singular}" ${r.count===0?'disabled':''}>−</button><b>${r.count}</b><button data-key="${r.key}" data-delta="1" aria-label="Add one ${r.singular}">+</button></div></div><div class="track"><i class="${r.gap?'short':''}" style="width:${Math.min(100,r.capacity/target*100)}%"></i></div><div class="rowline"><span>${num(r.capacity)} scooters supported</span><span class="${r.gap?'gap':'ok'}">${r.gap?'Add '+r.gap+' '+unit:'Target covered'}</span></div></div>`
}
function render(){
  const c=current(), p=plan(c)
  $('title').textContent = field?'Field work':'Expansion planner'
  document.title='Fleet Desk · '+$('title').textContent
  $('subtitle').textContent=field?'Track breakdowns, route repairs, and return scooters to service.':'Model a city rollout against hub capacity and daily operating costs.'
  $('planTab').classList.toggle('current',!field)
  $('fieldTab').classList.toggle('current',field)
  $('planTab').setAttribute('aria-pressed',String(!field))
  $('fieldTab').setAttribute('aria-pressed',String(field))
  $('planning').hidden=field; $('field').hidden=!field
  $('jobCount').textContent=p.open
  $('scenarioTitle').textContent=c.name+' rollout'
  $('baseline').textContent=c.hub+' hub · Pilot baseline of '+num(c.base)+' scooters'
  $('scale').value=c.scale; $('mult').textContent=c.scale+'×'
  $('scale').setAttribute('aria-valuetext',c.scale+' times the pilot fleet')
  $('metrics').innerHTML=metric('Fleet target',num(p.target),'Scooters to deploy')+metric('Available fleet',num(p.active),'Capacity and repairs included')+metric('Availability',(Math.round(p.coverage*100)/100)+'%','Launch threshold ≥95%')+metric('Daily contribution',money(p.margin),'Per deployed scooter · target ≥₹30')
  $('resources').innerHTML=p.rows.map(r=>capacityRow(r,p.target)).join('')
  $('size').disabled=p.rows.every(r=>r.gap===0)
  $('decision').textContent=p.ready?'Ready for rollout':'Hold rollout'
  $('decision').className='decision'+(p.ready?' good':'')
  const minCap=Math.min(...p.rows.map(r=>r.capacity))
  const minimum=p.rows.filter(r=>r.capacity===minCap).map(r=>r.short.toLowerCase()).join(' and ')
  const reason=[]
  if(!p.qualityOK && minCap<p.target*.95)reason.push('At current staffing and infrastructure, '+minimum+' supports '+num(minCap)+' of '+num(p.target)+' planned scooters.')
  if(!p.qualityOK && p.target-p.open<p.target*.95)reason.push(p.open+' scooters have open work orders. Resolve repairs to restore availability.')
  if(!p.marginOK)reason.push('Daily contribution falls below ₹30 per deployed scooter. Review capacity costs and rental revenue.')
  $('reason').textContent=reason.join(' ')||'The hub meets both launch thresholds under these assumptions.'
  $('gates').innerHTML=[['Availability ≥95%',p.qualityOK],['Contribution ≥₹30',p.marginOK]].map(([name,ok])=>`<div class="gate"><span>${name}</span><b class="${ok?'ok':'gap'}">${ok?'Pass':'Below target'}</b></div>`).join('')
  const costs=[['Daily rental revenue',p.revenue],['Hub overhead',p.facilityCost],['Deployed fleet cost',p.fleetCost],['Charging and energy',p.energyCost],['Bays and staffing',p.resourceCost],['Total operating cost',p.cost],['Daily contribution',p.revenue-p.cost]]
  $('assumptions').innerHTML=`<p>All figures are illustrative. Each available scooter earns ${money(c.rate)} per day and uses one ₹18 charge. Each deployed scooter costs ₹85 per day. Fixed hub overhead is ₹2,200 per day. Contribution per deployed scooter = (rental revenue − operating cost) ÷ target fleet.</p><p>${p.rows.map(r=>r.detail+' ('+money(r.daily)+' per '+r.singular+' per day)').join('. ')}.</p><p>Available fleet is the smaller of hub capacity and scooters outside repair. Each open work order represents one unavailable scooter. This one-day steady-state model assumes demand for every available scooter.</p>`+costs.map(([label,v])=>`<div class="subline"><span>${label}</span><b>${money(v)}</b></div>`).join('')
  $('queueTitle').textContent=c.hub+' work orders'
  $('jobs').innerHTML=c.jobs.length?[...c.jobs].reverse().map(j=>`<div class="job"><div class="jobhead"><b>${esc(j.asset)}</b><span class="pill">${esc(j.status)}</span></div><p>${esc(j.type)} · ${esc(j.owner||'Awaiting assignment')}</p>${j.status==='Resolved'?'':`<button data-job="${esc(j.id)}">${j.status==='Open'?'Assign to '+team(j.type):'Resolve work order'}</button>`}</div>`).join(''):'<p class="hint row">No breakdowns reported for this hub.</p>'
}
function team(type){return {'Charging issue':'charging team','Service inspection':'service team','Roadside pickup':'field crew'}[type]}
function view(show){field=show;notify('');render()}
$('planTab').onclick=()=>view(false); $('fieldTab').onclick=$('workBtn').onclick=()=>view(true)
$('city').onchange=e=>{
  if(e.target.value==='new'){$('city').value=String(index);$('newCity').showModal();return}
  index=Number(e.target.value);$('report').reset();notify('');render()
}
$('cancel').onclick=()=>$('newCity').close()
$('cityForm').onsubmit=e=>{
  e.preventDefault()
  const name=$('cityName').value.trim(),hub=$('hubName').value.trim()
  if(!name||!hub||cities.some(c=>c.name.toLowerCase()===name.toLowerCase())){
    $('cityName').setCustomValidity('Enter a unique city and a hub name.');$('cityName').reportValidity();return
  }
  cities.push({name,hub,base:Number($('pilot').value),scale:1,bays:0,techs:0,crews:0,rate:210,jobs:[]})
  index=cities.length-1;field=false;options();$('newCity').close();$('cityForm').reset();save('City pilot created.')
}
$('cityForm').oninput=()=>$('cityName').setCustomValidity('')
$('scale').oninput=e=>{current().scale=Number(e.target.value);save()}
$('resources').onclick=e=>{
  const btn=e.target.closest('button[data-key]');if(!btn)return
  const c=current();c[btn.dataset.key]=Math.max(0,c[btn.dataset.key]+Number(btn.dataset.delta));save()
  const next=$('resources').querySelector('[data-key="'+btn.dataset.key+'"][data-delta="'+btn.dataset.delta+'"]:not(:disabled)')||$('resources').querySelector('[data-key="'+btn.dataset.key+'"][data-delta="1"]')
  next?.focus()
}
$('size').onclick=()=>{const c=current();for(const r of plan(c).rows)c[r.key]+=r.gap;save('Added the capacity required for the target fleet.')}
$('report').onsubmit=e=>{
  e.preventDefault()
  const c=current(),asset=$('asset').value.trim().toUpperCase()
  if(c.jobs.some(j=>j.asset===asset&&j.status!=='Resolved')){notify('This scooter already has an open work order.');return}
  if(plan(c).open>=plan(c).target){notify('Every planned scooter already has an open work order.');return}
  c.jobs.push({id:crypto.randomUUID(),asset,type:$('type').value,owner:'',status:'Open'});$('report').reset();save('Breakdown recorded for '+asset+'.')
}
$('jobs').onclick=e=>{
  const btn=e.target.closest('[data-job]');if(!btn)return
  const job=current().jobs.find(j=>j.id===btn.dataset.job)
  if(job.status==='Open'){job.status='Assigned';job.owner=team(job.type)}else if(job.status==='Assigned')job.status='Resolved'
  save(job.asset+' · '+job.status)
}
options();render()
