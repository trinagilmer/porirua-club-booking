import express from 'express';
import calendarRouter from './modules/calendar/calendar.routes';
import leadsRouter from './modules/leads/leads.routes';
import proposalsRouter from './modules/proposals/proposals.routes';
import polipayRouter from './modules/payments/polipay.routes';

const app = express();

export default app;
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', calendarRouter);
app.use('/api', leadsRouter);
app.use('/api', proposalsRouter);
app.use('/api', polipayRouter);
import polipayWebhookRouter from './modules/webhooks/polipay.routes';
import xeroRouter from './modules/invoices/xero.routes';
import menuItemsRouter from './modules/menus/menuItems.routes';

app.use('/api', polipayWebhookRouter);
app.use('/api', xeroRouter);
app.use('/api', menuItemsRouter);
import menuItemPricesRouter from './modules/menus/menuItemPrices.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';

app.use('/api', menuItemPricesRouter);
app.use('/api', dashboardRouter);

import emailsRouter from './modules/emails/emails.routes';
app.use('/api', emailsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
