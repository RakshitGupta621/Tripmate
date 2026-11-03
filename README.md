# TripMate

TripMate plans compact city getaways from a starting city, destination, and trip length. It uses Groq for the itinerary, OpenStreetMap services for city locations and a free map, and Wikipedia for a short destination summary.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and add a Groq API key from [GroqCloud](https://console.groq.com/keys).
3. Install packages and start both the React app and API server:

   ```sh
   npm install
   npm run dev
   ```

4. Open the Vite address printed in the terminal (usually `http://localhost:5173`).

The Groq key is read only by the Express server. Do not add it to a `VITE_` variable or commit `.env`. The app defaults to `qwen/qwen3.8-27b`; `GROQ_MODEL` can override it. `AI_TIMEOUT_MS` can adjust the request timeout (default 60 seconds; capped at 120 seconds). For production, run `npm run build`, then set `NODE_ENV=production` and start with `npm start`.

## Features and resilience

- Plans 1–10 days with only the essential inputs: starting city, destination, and trip length.
- Accepts a 1–12 person group size and an optional per-person trip budget in Indian rupees (INR), then scales and splits the group total across travel (25%), stay (35%), food (20%), shopping (10%), and activities (10%). The total is included in the itinerary prompt and the rounded allocations sum exactly to the group total.
- Plans a comfortable daily pace with a destination-specific mix of notable sights, heritage, food, gardens, and religious places where relevant. Activity counts vary by day, with estimated start times and visit durations to account for travel and rest.
- Suggests matching cities as you type, with keyboard navigation and country/state labels to distinguish duplicates.
- Keeps the day-by-day itinerary focused on the destination and shows only the destination city in the map panel; the source city is used for the separate travel note.
- Validates inputs on both client and server; checks geocoded city names before generating.
- Keeps itinerary responses in a small in-memory cache for 30 minutes to avoid duplicate Groq requests. The cache resets when the server restarts.
- Explains missing key, rate limit, timeout, upstream, and malformed-response errors. If Groq cannot generate a plan, the app looks for nearby cities and lets the traveler switch destinations.
- Loads a Wikipedia summary independently, so a missing summary does not block the itinerary.
- Uses Photon for debounced city suggestions, OpenStreetMap/Nominatim for final geocoding, OpenStreetMap tiles through Leaflet, and Overpass for nearby-city suggestions. The map line is a direct, approximate city-to-city line; it is not turn-by-turn routing. These community services are free to use within their usage policies and may occasionally be unavailable.

## Checks

```sh
npm test
npm run build
```

Tests cover request validation, Groq response parsing and failures, itinerary display, and nearby-city fallback UI.
