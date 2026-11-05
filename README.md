# TripMate

TripMate plans compact city getaways from a starting city, destination, and trip length. It uses Groq for the itinerary, OpenStreetMap services for city locations and a free map, and Wikipedia for a short destination summary.

<img width="1256" height="749" alt="image" src="https://github.com/user-attachments/assets/b877b4c3-66f8-44c5-aab2-9ea543ee09b9" />
<img width="1440" height="780" alt="image" src="https://github.com/user-attachments/assets/4ed64fe7-958c-4ea8-b3d3-f91661af3f00" />
<img width="1332" height="731" alt="image" src="https://github.com/user-attachments/assets/e5811a78-2d92-4c40-937e-0ace3bf3e39b" />
<img width="1256" height="749" alt="image" src="https://github.com/user-attachments/assets/9c13d8c8-1935-48f0-ac07-a6f6fdace697" />
<img width="1431" height="781" alt="image" src="https://github.com/user-attachments/assets/cafda70f-759e-4218-86d6-afccef8892c3" />

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

- Plans trips of up to 10 days from departure and return dates; trip length is calculated automatically.
- Accepts a 1–12 person group size and an optional total trip budget in Indian rupees (INR) for the whole group. Groq suggests destination-specific category shares; when it omits them, TripMate estimates shares from the city cost profile, trip length, transport, and traveler preferences. Category amounts always add up to the selected total.
- Keeps preferences optional: travel style changes daily pace and cost/comfort choices; selected interests guide the actual stops, alongside transport and family-friendly choices. The results show a small recap of the preferences used.
- Lets travelers choose when they want to depart and arrive. The itinerary gives estimated departure and arrival windows that fit the selected transport and route; travelers should check live train or flight schedules before booking.
- Builds a schedule density around the selected pace: roughly 2–4 stops for relaxed, 3–5 for balanced, or up to 7 for active days when travel times and visit durations allow. It groups stops by area, orders them by time, and keeps arrival and transfer days lighter.
- Suggests matching cities as you type, with keyboard navigation and country/state labels to distinguish duplicates.
- Keeps the selected destination at the center of the itinerary and map; the source city is used only for the separate travel recommendation.
- Validates inputs on both client and server; checks geocoded city names before generating.
- Keeps itinerary responses in a small in-memory cache for 30 minutes to avoid duplicate Groq requests. Preference selections are part of the cache key, so a different style or interest set gets its own plan. The cache resets when the server restarts.
- Explains missing key, rate limit, timeout, upstream, and malformed-response errors.
- Loads a text-only Wikipedia summary independently, so a missing summary does not block the itinerary.
- Uses Photon for debounced city suggestions, OpenStreetMap/Nominatim for final geocoding, and OpenStreetMap tiles through Leaflet. The destination map can filter stops by day, show same-area stop groups, and draw estimated walking or driving routes using the public Valhalla demo. A day-specific directions link opens in Google Maps without an API key. Public community routing services follow fair-use limits, may be unavailable, and should not be treated as live navigation; route links remain available when route estimates fail.

### Free service limits

The public Valhalla routing demo is suitable for a small hobby app and can rate-limit requests; for heavier production traffic, use a hosted routing service or maintain your own Valhalla instance. Google Maps is opened only when a traveler selects directions; TripMate does not call a paid Google Maps API.

## Checks

```sh
npm run check
```

The check runs Prettier validation, ESLint, TypeScript validation, all tests, and the production build. The same command runs from the Git pre-push hook and GitHub Actions.

## Code layout

- `src/components/App/App.tsx` coordinates form state, API requests, session caching, and itinerary state.
- `src/components/AppContent/AppContent.tsx` composes the planner and itinerary views.
- Each component folder contains its TSX component, a matching `.test.tsx` file, and a named `.types.ts` file.
- `src/components/` contains the planner controls and reusable result cards.
- `src/constants/` and `src/utils/` hold shared form defaults, options, formatting, date, and preference helpers.
- `server/` validates requests, caches plans by their inputs, and builds the provider prompt.
