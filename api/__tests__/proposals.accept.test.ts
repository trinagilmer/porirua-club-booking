import { acceptProposal } from '../src/modules/proposals/proposals.accept';
import { query } from '../src/db';

jest.mock('../src/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('acceptProposal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update function status to confirmed', async () => {
    mockQuery.mockResolvedValueOnce({});

    const result = await acceptProposal('proposal1');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE functions SET status = \'confirmed\''),
      ['proposal1']
    );
    expect(result.message).toMatch(/Proposal accepted/);
  });
});
