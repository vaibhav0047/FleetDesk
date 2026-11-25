export const resources = [
  {key:'bays', name:'Charging bays', short:'Charging', unit:'bays', singular:'bay', daily:420, throughput:20, detail:'20 scooter charges per bay per day'},
  {key:'techs', name:'Service technicians', short:'Service', unit:'technicians', singular:'technician', daily:1100, throughput:150, detail:'6 repairs per technician per day at 4 repairs per 100 scooters'},
  {key:'crews', name:'Field crews', short:'Field coverage', unit:'crews', singular:'crew', daily:900, throughput:90, detail:'90 scooters covered per crew per day'}
]

export function plan(city) {
  const target = city.base * city.scale
  const open = city.jobs.filter(j => j.status !== 'Resolved').length
  const rows = resources.map(r => {
    const count = city[r.key]
    const required = Math.ceil(target / r.throughput)
    return {...r, count, required, gap:Math.max(0, required-count), capacity:count*r.throughput}
  })
  const supported = Math.min(target, ...rows.map(r => r.capacity))
  const active = Math.min(supported, Math.max(0,target-open))
  const coverage = 100*active/target
  const revenue = active*city.rate
  const facilityCost = 2200
  const fleetCost = 85*target
  const energyCost = 18*active
  const resourceCost = rows.reduce((sum,r)=>sum+r.count*r.daily,0)
  const cost = facilityCost+fleetCost+energyCost+resourceCost
  const margin = (revenue-cost)/target
  const qualityOK = coverage >= 95
  const marginOK = margin >= 30
  return {target,open,rows,active,coverage,revenue,cost,margin,facilityCost,fleetCost,energyCost,resourceCost,qualityOK,marginOK,ready:qualityOK&&marginOK}
}

export function seedCities() {
  return [
    {name:'Bengaluru',hub:'HSR Layout',base:100,scale:2,bays:8,techs:1,crews:2,rate:210,jobs:[
      {id:'BLR-014',asset:'BLR-042',type:'Charging issue',owner:'',status:'Open'},
      {id:'BLR-015',asset:'BLR-071',type:'Service inspection',owner:'Service team',status:'Assigned'}]},
    {name:'Pune',hub:'Kharadi',base:60,scale:1,bays:4,techs:1,crews:1,rate:205,jobs:[]},
    {name:'Hyderabad',hub:'Madhapur',base:80,scale:1,bays:5,techs:1,crews:1,rate:195,jobs:[]}
  ]
}
