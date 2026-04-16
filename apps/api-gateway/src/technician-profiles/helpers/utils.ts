export function buildTechnicianCountMap(
  rows: Array<{ technician_id: string; relation_id: string }>,
) {
  const map = new Map<string, Set<string>>();

  for (const row of rows) {
    const technicians = map.get(row.relation_id) ?? new Set<string>();
    technicians.add(row.technician_id);
    map.set(row.relation_id, technicians);
  }

  return map;
}
