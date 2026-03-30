import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json([])

  // Photon (Komoot) — free OSM geocoder with excellent POI support (hotels, airports, etc.)
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) return NextResponse.json([])

  const geojson = await res.json()

  // Normalise to a flat list the component can use
  const results = (geojson.features ?? []).map((f: any) => {
    const p = f.properties
    const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean)
    return {
      place_id:     f.properties.osm_id ?? Math.random(),
      display_name: parts.join(', '),
      type:         p.type ?? p.osm_value ?? '',
      lat:          String(f.geometry.coordinates[1]),
      lon:          String(f.geometry.coordinates[0]),
    }
  })

  return NextResponse.json(results)
}
