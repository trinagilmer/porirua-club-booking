import Handlebars from 'handlebars';

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

export function compileTemplate(templateString: string): Handlebars.TemplateDelegate {
  if (templateCache.has(templateString)) {
    return templateCache.get(templateString)!;
  }
  const compiled = Handlebars.compile(templateString);
  templateCache.set(templateString, compiled);
  return compiled;
}

export function mergeTemplate(templateString: string, variables: Record<string, any>): string {
  const compiled = compileTemplate(templateString);
  return compiled(variables);
}
