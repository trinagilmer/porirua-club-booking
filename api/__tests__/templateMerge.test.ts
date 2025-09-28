import { mergeTemplate } from '../src/utils/templateMerge';

test('mergeTemplate replaces variables correctly', () => {
  const template = 'Hello {{name}}, your event is {{event}}.';
  const variables = { name: 'Alice', event: 'Party' };
  const result = mergeTemplate(template, variables);
  expect(result).toBe('Hello Alice, your event is Party.');
});
