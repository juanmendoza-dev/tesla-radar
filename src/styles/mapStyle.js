const mapStyle = {
  version: 8,
  name: 'Tesla Radar Neon',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  layers: [
    // ── Pure black background ──
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#000000',
      },
    },

    // ── Water (near-black) ──
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#020208',
      },
    },

    // ── Land cover (invisible) ──
    {
      id: 'landcover',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0,
      },
    },

    // ── Minor roads: #003a7a at 7px ──
    {
      id: 'road-minor-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'service', 'track', 'minor', 'tertiary'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#003a7a',
        'line-width': 7,
        'line-blur': 8,
        'line-opacity': 0.06,
      },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'service', 'track', 'minor', 'tertiary'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#003a7a',
        'line-width': 1,
        'line-opacity': 0.5,
      },
    },

    // ── Main roads (secondary + primary): #0066cc at 12px ──
    {
      id: 'road-main-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'primary'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0066cc',
        'line-width': 12,
        'line-blur': 10,
        'line-opacity': 0.08,
      },
    },
    {
      id: 'road-main',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'primary'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0066cc',
        'line-width': 1.8,
        'line-opacity': 0.7,
      },
    },

    // ── Highways (trunk + motorway): #00b4ff at 18px glow ──
    {
      id: 'road-highway-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'trunk', 'motorway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#00b4ff',
        'line-width': 18,
        'line-blur': 14,
        'line-opacity': 0.15,
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'trunk', 'motorway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#00b4ff',
        'line-width': 2.5,
        'line-blur': 1,
        'line-opacity': 0.9,
      },
    },

    // ── Boundaries ──
    {
      id: 'boundary-country',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 2],
      paint: {
        'line-color': 'rgba(255,255,255,0.04)',
        'line-width': 0.8,
        'line-dasharray': [4, 3],
      },
    },

    // ── Subtle street name labels ──
    {
      id: 'road-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-max-angle': 30,
        'text-padding': 2,
      },
      paint: {
        'text-color': 'rgba(255,255,255,0.12)',
        'text-halo-color': 'rgba(0,0,0,0.8)',
        'text-halo-width': 1,
      },
    },
  ],
};

export default mapStyle;
