# Networkee 2.1 — Interactive Network Map

Consumer-first Networkee prototype around **Remember → Understand → Act**.

## New in 2.1
- People now has a `People | Map` view switch.
- Interactive responsive world map powered by MapLibre GL JS.
- Contacts are geocoded automatically from city, region and country.
- No latitude/longitude fields are shown to users.
- Contact markers open a compact person preview and profile.
- `Alle anzeigen` fits all mapped contacts into view.
- Geocoding results are cached locally to avoid repeat requests.
- Geography remains accessible from Insights and the side menu.

## Prototype note
This GitHub Pages prototype uses MapLibre's public demo style and the public OpenStreetMap Nominatim geocoder for low-volume testing. Nominatim requests are cached and sequential. Before a public/commercial launch, replace the geocoder/style infrastructure with a production provider or your own backend/proxy.

## Files
This release archive intentionally contains only the files required by the current app.
