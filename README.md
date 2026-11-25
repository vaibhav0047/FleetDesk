# Fleet Desk

A working prototype for Bounce Daily Challenge 05. A city operator models a fleet rollout against charging, service, and field capacity, then checks scooter availability and daily contribution. All data and thresholds are illustrative.

## Run locally

From this directory run `python -m http.server 8000 --directory dist` and open http://localhost:8000. On Windows you can use `py` in place of `python`. The app uses native JavaScript modules and needs no package installation. Changes persist in the current browser and origin.

## Reproduce the demo

1. Select Bengaluru. Move the fleet multiplier to 10× to model 1,000 scooters.
2. Compare charging capacity (160), service capacity (150), and field coverage (180). The limiting resource caps availability at 150 scooters.
3. Choose **Size to target**. The model adds 42 bays, 6 technicians, and 10 field crews. Two scooters are in repair, leaving 998 available. Daily contribution is ₹64.92 per deployed scooter, rounded to ₹65 in the dashboard.
4. Open **Field work**, resolve the assigned service inspection, then return to **Launch planning**. Availability increases to 999 scooters.
5. To model another city, choose **Add new city…**, enter the pilot fleet and hub, and size the resources.

## Model and implementation

One bay supplies 20 charges per day. One technician completes six repairs per day with assumed incidence of four repairs per 100 scooters per day. One field crew covers 90 scooters. Available fleet is the minimum of infrastructure capacity and the fleet outside repair. The launch thresholds are 95% projected availability and ₹30 daily contribution per deployed scooter. Revenue assumes full rental demand for all available scooters. Costs include hub overhead, fleet costs, energy, bays, and staffing. See the in-app breakdown for the rates.

The model lives in `dist/engine.mjs`. Browser interactions and work order transitions live in `dist/app.mjs`. Run the model checks with `node --test checks.mjs` using Node.js 18 or later.

The scale factor models operational expansion. Multi-user dispatch, telemetry ingestion, and production throughput are outside this browser-local prototype.
