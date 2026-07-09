const API_BASE = '/api/v1'

export async function getPetTimeline(petId: string) {
  const res = await fetch(`${API_BASE}/pets/${petId}/timeline`)
  return res.json()
}
