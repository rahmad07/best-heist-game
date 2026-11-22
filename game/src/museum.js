// The floor plan of Galeri Aruna: walls, display cases, loot, patrols,
// cameras and the getaway door. Everything is a plain rectangle or point,
// so the painter, the guards and the sight checks all read the same plan.

export function buildMuseum() {
  const walls = [
    // Outer shell; the bottom wall leaves a gap for the getaway door.
    { x: 16, y: 76, w: 1248, h: 16 },
    { x: 16, y: 768, w: 24, h: 16 },
    { x: 140, y: 768, w: 1124, h: 16 },
    { x: 16, y: 76, w: 16, h: 708 },
    { x: 1248, y: 76, w: 16, h: 708 },
    // Vault alcove around the Bulan Sabit, top right: its door gap is east.
    { x: 1060, y: 92, w: 16, h: 150 },
    { x: 1060, y: 226, w: 140, h: 16 },
  ];
  const cases = [
    { x: 280, y: 220, w: 240, h: 40 },
    { x: 720, y: 220, w: 260, h: 40 },
    { x: 280, y: 480, w: 240, h: 40 },
    { x: 720, y: 480, w: 260, h: 40 },
    { x: 600, y: 330, w: 80, h: 80 },
    { x: 170, y: 330, w: 50, h: 140 },
    { x: 1090, y: 420, w: 50, h: 140 },
  ];
  const lootSpots = [
    { id: 'kala', name: 'Patung Kala', x: 400, y: 170, value: 100 },
    { id: 'senja', name: 'Lukisan Senja', x: 850, y: 170, value: 120 },
    { id: 'giok', name: 'Giok Aruna', x: 400, y: 620, value: 150 },
    { id: 'bulan', name: 'Bulan Sabit', x: 1160, y: 160, value: 300 },
  ];
  const guards = [
    { name: 'Bima', waypoints: [[200, 300], [1040, 300]] },
    { name: 'Sari', waypoints: [[1180, 300], [1180, 660]] },
    { name: 'Darma', waypoints: [[200, 640], [980, 640]] },
  ];
  const cameras = [
    { x: 640, y: 92, base: Math.PI / 2, sweep: 0.9, speed: 0.55, phase: 0 },
    { x: 1232, y: 300, base: -Math.PI * 0.75, sweep: 0.7, speed: 0.7, phase: 1.3 },
  ];
  return {
    walls,
    cases,
    lootSpots,
    guards,
    cameras,
    exit: { x: 40, y: 700, w: 100, h: 68 },
    entry: { x: 90, y: 730 },
  };
}
