import { createWelcomeEmailHtml } from '../src/infrastructure/email/NodemailerEmailService.js';

describe('welcome email template', () => {
  it('includes the display name and configured application link safely', () => {
    const html = createWelcomeEmailHtml('<Chef & Co>', 'https://culinary.example');

    expect(html).toContain('&lt;Chef &amp; Co&gt;');
    expect(html).toContain('href="https://culinary.example/recipes"');
    expect(html).not.toContain('<strong><Chef & Co></strong>');
  });
});
