import { query } from '../../db';
import { mergeTemplate } from '../../utils/templateMerge';

interface EmailSendInput {
  to: string;
  subject: string;
  templateName: string;
  variables: Record<string, any>;
}

import { emailTemplates } from './emailTemplates';

const templates: Record<string, string> = {};

export function seedTemplates() {
  Object.assign(templates, emailTemplates);
}

export async function sendEmail(input: EmailSendInput) {
  const { to, subject, templateName, variables } = input;
  const templateString = templates[templateName];
  if (!templateString) {
    throw new Error(`Template ${templateName} not found`);
  }

  const body = mergeTemplate(templateString, variables);

  // Simulate sending email (replace with real provider later)
  console.log(`Simulated sending email to ${to} with subject '${subject}':\n${body}`);

  // Log email send to DB (simulate table emails with columns: to, subject, body, sent_at)
  await query(
    `INSERT INTO emails (recipient, subject, body, sent_at) VALUES ($1, $2, $3, NOW())`,
    [to, subject, body]
  );

  return { to, subject, body };
}
