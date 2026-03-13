const mapStyle = {
  version: 8,
  name: 'Tesla Radar Dark',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  layers: [
    // ── Background ──
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#000000',
      },
    },

    // ── Water ──
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#050510',
      },
    },

    // ── Land cover (hidden — pure black land) ──
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

    // ── Roads: service / track ──
    {
      id: 'road-service-track',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'service', 'track'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#061a2e',
        'line-width': 0.5,
        'line-opacity': 0.4,
      },
    },

    // ── Roads: residential / tertiary ──
    {
      id: 'road-residential-tertiary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'minor', 'tertiary'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#0a3050',
        'line-width': 0.8,
        'line-opacity': 0.7,
      },
    },

    // ── Roads: secondary ──
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'secondary'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#0a4f8a',
        'line-width': 1.2,
        'line-opacity': 0.8,
      },
    },

    // ── Roads: primary ──
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#0070b0',
        'line-width': 1.5,
        'line-opacity': 0.85,
      },
    },

    // ── Roads: trunk ──
    {
      id: 'road-trunk',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'trunk'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#0090d0',
        'line-width': 2,
        'line-opacity': 0.9,
      },
    },

    // ── Roads: motorway glow (under layer) ──
    {
      id: 'road-motorway-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'motorway'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#00b4ff',
        'line-width': 6,
        'line-blur': 6,
        'line-opacity': 0.15,
      },
    },

    // ── Roads: motorway ──
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'motorway'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#00b4ff',
        'line-width': 2.5,
        'line-blur': 2,
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
        'line-color': 'rgba(255,255,255,0.06)',
        'line-width': 0.8,
        'line-dasharray': [4, 3],
      },
    },

    // ── Street name labels ──
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
        'text-color': 'rgba(255,255,255,0.15)',
        'text-halo-color': 'rgba(0,0,0,0.6)',
        'text-halo-width': 1,
      },
    },

    // ── Place labels ──
    {
      id: 'place-label-city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'city'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 13,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
      },
      paint: {
        'text-color': 'rgba(255,255,255,0.15)',
        'text-halo-color': 'rgba(0,0,0,0.6)',
        'text-halo-width': 1,
      },
    },
  ],
};

export default mapStyle;
