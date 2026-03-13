# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Panoptikum** is a Flask web application that serves a searchable API and single-page frontend for a digital art archive ("Bildarchiv JS" — artworks by Jürg Straumann). It loads CSV data files using Frictionless Data / pandas, exposes a JSON API with filtering/sorting/pagination, and renders a vanilla JS + Bootstrap SPA.

Live site: https://bildarchiv-js.ch/

## Development Commands

```bash
# Setup
python3 -m pip install pipenv
pipenv --python 3
pipenv sync

# Run development server
pipenv shell
env FLASK_DEBUG=1 flask run

# Lint JavaScript
npx eslint static/
```

## Data Pipeline (run locally before deploying data changes)

```bash
./convert.sh       # Resize/standardize new images to 1920x1080 JPEG (requires ImageMagick)
./thumbs.sh        # Generate 200x200 thumbnails (requires ImageMagick)
python collect.py  # Read WERKVERZEICHNIS.csv + images/, compute brightness/hue/saturation, output data/images.csv
python stats.py    # Recount filter values, update data/filters.csv
```

After running the pipeline, rsync new images to the production server, then push to GitHub master (CI auto-deploys via Dokku).

## Architecture

### Data flow
1. `data/WERKVERZEICHNIS.csv` — master artwork metadata (imported from Excel, manually edited)
2. `collect.py` reads it + scans `images/` folders, calculates visual properties per image, writes `data/images.csv`
3. `stats.py` reads `images.csv`, counts filter values, writes `data/filters.csv`
4. `app.py` loads `data/images.csv` and `data/filters.csv` at startup into pandas DataFrames

### Backend (`app.py` + `util.py`)
- Flask app with no database — all data lives in CSV files loaded at startup
- API routes: `/api/<resource>` (paginated), `/api/<resource>.random` (30 random), `/api/<resource>/all.json` (all records)
- `util.py` provides `filter_columns()`, `filter_by_range()`, `sort_data()`, `paginate_data()` used by app.py

### Frontend (`templates/public/index.html`, `static/`)
- SPA with tabs: Search / Display / List / Works
- `static/site.js` — filter initialization, event listeners, caches data from API
- `static/search.js` — search logic, UI state, URL hash state for bookmarkable searches
- Third-party libs bundled in `static/lib/`: jQuery, Bootstrap, LightGallery, nouislider, Clusterize.js

### Image storage
Images live in `images/WV_ab XXXX/` folders with `thumb/` subdirectory per folder. New imports stage in `IMPORT/WV_neu_$date/` before processing.

## Key Files

| File | Purpose |
|---|---|
| `app.py` | Flask app, all API route definitions |
| `util.py` | Filtering, sorting, pagination logic |
| `collect.py` | Metadata + image property computation → `data/images.csv` |
| `stats.py` | Filter count computation → `data/filters.csv` |
| `data/WERKVERZEICHNIS.csv` | Source of truth for artwork metadata |
| `data/datapackage.json` | Frictionless Data Package spec (schema definitions) |
| `Procfile` | Gunicorn command for Dokku deployment |
| `.github/workflows/autodeploy.yml` | Auto-deploy to Dokku on push to master |
