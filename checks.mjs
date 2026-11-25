import test from 'node:test'
import assert from 'node:assert/strict'
import {plan,seedCities} from './dist/engine.mjs'

test('Bengaluru at tenfold scale is limited by the service network',()=>{
  const city=seedCities()[0]
  city.scale=10
  const p=plan(city)
  assert.equal(p.target,1000)
  assert.equal(p.active,150)
  assert.equal(p.ready,false)
  assert.deepEqual(p.rows.map(r=>r.gap),[42,6,10])
})

test('sized hub accounts for repairs, costs, and released scooters',()=>{
  const city=seedCities()[0]
  city.scale=10
  for(const row of plan(city).rows) city[row.key]+=row.gap
  const p=plan(city)
  assert.equal(p.active,998)
  assert.equal(p.coverage,99.8)
  assert.equal(p.ready,true)
  assert.equal(Math.round(p.margin),65)
  city.jobs[1].status='Resolved'
  assert.equal(plan(city).active,999)
  city.rate=1
  assert.equal(plan(city).ready,false)
})

test('new hub with no infrastructure cannot launch',()=>{
  const city={...seedCities()[1],bays:0,techs:0,crews:0}
  const p=plan(city)
  assert.equal(p.active,0)
  assert.ok(p.margin<0)
  assert.equal(p.ready,false)
})
