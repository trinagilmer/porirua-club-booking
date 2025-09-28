import { createInvoiceForProposal } from '../src/modules/invoices/xero.service';
import { query } from '../src/db';

jest.mock('../src/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

jest.mock('../src/modules/invoices/xero.adapter', () => ({
  createXeroInvoice: jest.fn().mockResolvedValue({
    Invoices: [{ InvoiceID: '12345' }]
  }),
  getStoredXeroToken: jest.fn().mockResolvedValue({ access_token: 'token' }),
}));

describe('createInvoiceForProposal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an invoice and update proposal', async () => {
    mockQuery.mockResolvedValue({});

    const response = await createInvoiceForProposal('proposal1', 'tenant1');

    expect(response.Invoices[0].InvoiceID).toBe('12345');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE proposals SET xero_invoice_id'),
      ['12345', 'proposal1']
    );
  });
});
