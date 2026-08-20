export function computeStats(checkins) {
  const totalEntries = checkins.length;
  const establishments = new Set(checkins.map((c) => c.establishment_detail?.name).filter(Boolean)).size;
  const rated = checkins.filter((c) => c.rating > 0);
  const overallAvg = rated.length ? rated.reduce((s, c) => s + c.rating, 0) / rated.length : 0;
  return { totalEntries, establishments, overallAvg };
}
