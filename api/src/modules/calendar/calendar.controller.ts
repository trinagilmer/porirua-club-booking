import { Request, Response } from 'express';
import { getCalendarEvents } from './calendar.service';
import { checkConflictOnStatusChange } from './calendar.status';

export async function getCalendar(req: Request, res: Response) {
  const { from, to, room, type, status, owner } = req.query;

  try {
    const events = await getCalendarEvents({ from, to, room, type, status, owner });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
}

// Example endpoint to update status with conflict check
export async function updateStatus(req: Request, res: Response) {
  const { functionId, newStatus, newStart, newEnd, roomId } = req.body;

  try {
    const conflictCheck = await checkConflictOnStatusChange(
      functionId,
      newStatus,
      new Date(newStart),
      new Date(newEnd),
      roomId
    );

    if (conflictCheck.conflict) {
      return res.status(409).json({ message: 'Conflict detected', conflicts: conflictCheck.conflicts });
    }

    // TODO: Update the function status in DB here

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
}
