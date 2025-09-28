import { checkConflictOnStatusChange } from '../src/modules/calendar/calendar.status';
import { query } from '../src/db';

jest.mock('../src/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('checkConflictOnStatusChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no conflict if new status is not confirmed', async () => {
    const result = await checkConflictOnStatusChange('1', 'pending', new Date('2024-07-01'), new Date('2024-07-02'), 'room1');
    expect(result.conflict).toBe(false);
  });

  it('should detect conflict if overlapping confirmed event exists', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: '2', room_id: 'room1', event_start: new Date('2024-07-01T10:00:00Z'), event_end: new Date('2024-07-01T12:00:00Z'), status: 'confirmed' }
      ]
    });

    const result = await checkConflictOnStatusChange('1', 'confirmed', new Date('2024-07-01T11:00:00Z'), new Date('2024-07-01T13:00:00Z'), 'room1');
    expect(result.conflict).toBe(true);
    expect(result.conflicts).toHaveLength(1);
  });

  it('should return no conflict if no overlapping events', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await checkConflictOnStatusChange('1', 'confirmed', new Date('2024-07-01T08:00:00Z'), new Date('2024-07-01T09:00:00Z'), 'room1');
    expect(result.conflict).toBe(false);
  });
});
