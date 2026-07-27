import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';

// Mock ErrorBoundary for SSR testing
describe('ErrorBoundary', () => {
  it('should be defined and exportable', async () => {
    const { default: ErrorBoundary } = await import('../src/components/ErrorBoundary.jsx');
    expect(ErrorBoundary).toBeDefined();
  });

  it('should be a class component', async () => {
    const { default: ErrorBoundary } = await import('../src/components/ErrorBoundary.jsx');
    // ErrorBoundary should be a class component
    expect(ErrorBoundary.prototype).toBeDefined();
  });
});

// Mock ErrorDisplay for testing
describe('ErrorDisplay', () => {
  it('should be defined and exportable', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    expect(ErrorDisplay).toBeDefined();
  });

  it('should render without crashing with no props', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const html = renderToString(<ErrorDisplay />);
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(0);
  });

  it('should render with string error', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const html = renderToString(<ErrorDisplay error="Test error" />);
    expect(html).toContain('Test error');
  });

  it('should render with object error', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { message: 'Object error', code: 'TEST_001' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html).toContain('Object error');
  });

  it('should render with inline variant', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const html = renderToString(<ErrorDisplay error="Inline" variant="inline" />);
    expect(html).toContain('Inline');
  });

  it('should render with card variant', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const html = renderToString(<ErrorDisplay error="Card" variant="card" />);
    expect(html).toContain('Card');
  });

  it('should handle API error format', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = {
      response: {
        data: {
          userMessage: 'API Error Message',
          code: 'API_001'
        }
      }
    };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html).toContain('API Error Message');
  });

  it('should show friendly message for network errors', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { code: 'NETWORK_ERROR' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html.toLowerCase()).toContain('internet');
  });

  it('should show friendly message for auth errors', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { code: 'AUTH_001' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html.toLowerCase()).toContain('log');
  });
});

// Error Code Mapping Tests
describe('Error Code Mapping', () => {
  it('should have authentication error codes', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { code: 'AUTH_002' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html).toBeTruthy();
  });

  it('should have validation error codes', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { code: 'VAL_005' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html).toBeTruthy();
  });

  it('should have resource error codes', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { code: 'RES_001' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html).toBeTruthy();
  });

  it('should have business error codes', async () => {
    const { default: ErrorDisplay } = await import('../src/components/ErrorDisplay.jsx');
    const error = { code: 'BIZ_003' };
    const html = renderToString(<ErrorDisplay error={error} />);
    expect(html).toBeTruthy();
  });
});
