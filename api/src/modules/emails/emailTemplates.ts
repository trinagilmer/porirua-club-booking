export const emailTemplates: Record<string, string> = {
  proposal_sent: `Dear {{client_name}},

Thank you for your interest in our services for the event "{{event_title}}" on {{event_date}} in {{room_name}}.

We look forward to working with you.

Best regards,
The Team`,

  proposal_reminder: `Dear {{client_name}},

This is a friendly reminder about your proposal for the event "{{event_title}}" scheduled on {{event_date}} in {{room_name}}.

Please let us know if you have any questions.

Best regards,
The Team`,

  xero_invoice_sent: `Dear {{client_name}},

Your invoice number {{xero_invoice_number}} for the event "{{event_title}}" on {{event_date}} in {{room_name}} has been sent.

The deposit due is {{deposit_due}} and the balance due is {{balance_due}}.

You can pay securely via this link: {{polipay_link}}

Thank you for your business.

Best regards,
The Team`
};
