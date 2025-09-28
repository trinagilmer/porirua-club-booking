import { query } from '../../db';
import { rangesOverlap, TimeRange } from '../../utils/timeRangeUtils';

interface FunctionEvent {
  id: string;
  room_id: string;
  event_start: Date;
  event_end: Date;
  status: string;
}

export async function checkConflictOnStatusChange(
  functionId: string,
  newStatus: string,
  newStart: Date,
  newEnd: Date,
  roomId: string
): Promise<{ conflict: boolean; conflicts?: FunctionEvent[] }> {
  if (newStatus !== 'confirmed') {
    return { conflict: false };
  }

  // Query to find overlapping confirmed events in the same room
  const result = await query(
    `SELECT id, room_id, event_start, event_end, status FROM functions WHERE room_id = $1 AND status = 'confirmed' AND id != $2`,
    [roomId, functionId]
  );

  const conflicts = result.rows.filter((event: FunctionEvent) => {
    const rangeA: TimeRange = { start: newStart, end: newEnd };
    const rangeB: TimeRange = { start: new Date(event.event_start), end: new Date(event.event_end) };
    return rangesOverlap(rangeA, rangeB);
  });

  if (conflicts.length > 0) {
    return { conflict: true, conflicts };
  }

  return { conflict: false };
}
