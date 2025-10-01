BEGIN;

INSERT INTO public.email_templates (key, name, subject, body_html, body_text, enabled)
VALUES
  ('lead_thanks', 'Lead Thanks',
    'Thanks for your enquiry',
    '<p>Hi {{contact_name}},</p><p>Thanks for your enquiry about {{function_title}} on {{function_date}}. We’ll be in touch soon.</p>',
    'Hi {{contact_name}}, Thanks for your enquiry about {{function_title}} on {{function_date}}. We’ll be in touch soon.',
    true
  ),
  ('confirmed_details', 'Confirmed Details',
    'Your booking is confirmed',
    '<p>Hi {{contact_name}},</p><p>Your function {{function_title}} is now confirmed for {{function_date}}.</p>',
    'Hi {{contact_name}}, Your function {{function_title}} is now confirmed for {{function_date}}.',
    true
  ),
  ('deposit_thanks', 'Deposit Thanks',
    'Deposit received',
    '<p>Hi {{contact_name}},</p><p>We’ve received your deposit for {{function_title}} on {{function_date}}. Thank you!</p>',
    'Hi {{contact_name}}, We’ve received your deposit for {{function_title}} on {{function_date}}. Thank you!',
    true
  ),
  ('pre_event_check', 'Pre-Event Check',
    'Final check before your event',
    '<p>Hi {{contact_name}},</p><p>We’re looking forward to hosting {{function_title}} on {{function_date}}. Please confirm your details.</p>',
    'Hi {{contact_name}}, We’re looking forward to hosting {{function_title}} on {{function_date}}. Please confirm your details.',
    true
  ),
  ('invoice_sent', 'Invoice Sent',
    'Your invoice is ready',
    '<p>Hi {{contact_name}},</p><p>Please find attached your invoice for {{function_title}}.</p>',
    'Hi {{contact_name}}, Please find attached your invoice for {{function_title}}.',
    true
  ),
  ('final_thanks', 'Final Thanks',
    'Thank you for your event',
    '<p>Hi {{contact_name}},</p><p>Thank you for choosing us for {{function_title}}. We hope you had a great time!</p>',
    'Hi {{contact_name}}, Thank you for choosing us for {{function_title}}. We hope you had a great time!',
    true
  ),
  ('survey_invite', 'Survey Invite',
    'We’d love your feedback',
    '<p>Hi {{contact_name}},</p><p>Please take a moment to share feedback about {{function_title}}.</p><p><a href="{{survey_link}}">Take the survey</a></p>',
    'Hi {{contact_name}}, Please take a moment to share feedback about {{function_title}}: {{survey_link}}',
    true
  ),
  ('survey_thanks', 'Survey Thanks',
    'Thanks for your feedback',
    '<p>Hi {{contact_name}},</p><p>Thank you for sharing your feedback on {{function_title}}!</p>',
    'Hi {{contact_name}}, Thank you for sharing your feedback on {{function_title}}!',
    true
  )
ON CONFLICT (key) DO NOTHING;

COMMIT;
