import { createProposal } from '../src/modules/proposals/proposals.service';
import { query } from '../src/db';

jest.mock('../src/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('BEO section inclusion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include BEO section in proposal creation', async () => {
    const items = [{ name: 'BEO Section', price: 100 }];
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'proposal1', items }] });

    const result = await createProposal({ lead_id: 'lead1', event_id: 'event1', items, owner_user_id: 'user1' });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO proposals'),
      expect.any(Array)
    );
    expect(result.items).toContainEqual(expect.objectContaining({ name: 'BEO Section' }));
  });
});
