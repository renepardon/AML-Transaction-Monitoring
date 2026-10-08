import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('places sidebar, top bar and main content', () => {
    render(
      <AppShell sidebar={<aside>Side</aside>} topBar={<header>Top</header>}>
        Content
      </AppShell>,
    );
    expect(screen.getByRole('complementary')).toHaveTextContent('Side');
    expect(screen.getByRole('banner')).toHaveTextContent('Top');
    expect(screen.getByRole('main')).toHaveTextContent('Content');
  });
});
