import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaQuery } from '../../hooks/useMediaQuery';

describe('useMediaQuery', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  it('deve retornar false inicialmente quando media query não corresponde', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });

  it('deve retornar true inicialmente quando media query corresponde', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });

  it('deve adicionar event listener na montagem', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('deve remover event listener na desmontagem', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('deve atualizar o estado quando a media query muda', () => {
    let changeListener: (event: MediaQueryListEvent) => void;

    mockAddEventListener.mockImplementation((event: string, listener: any) => {
      if (event === 'change') {
        changeListener = listener;
      }
    });

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    // Simula mudança na media query
    act(() => {
      changeListener({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);

    // Simula outra mudança
    act(() => {
      changeListener({ matches: false } as MediaQueryListEvent);
    });

    expect(result.current).toBe(false);
  });

  it('deve reagir a mudanças na query', () => {
    const { rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    );

    expect(mockMatchMedia).toHaveBeenLastCalledWith('(min-width: 768px)');

    rerender({ query: '(min-width: 1024px)' });

    expect(mockMatchMedia).toHaveBeenLastCalledWith('(min-width: 1024px)');
  });

  it('deve funcionar com diferentes tipos de media queries', () => {
    const queries = [
      '(min-width: 768px)',
      '(max-width: 1200px)',
      '(orientation: landscape)',
      '(prefers-color-scheme: dark)',
    ];

    queries.forEach(query => {
      mockMatchMedia.mockClear();
      renderHook(() => useMediaQuery(query));
      expect(mockMatchMedia).toHaveBeenCalledWith(query);
    });
  });
}); 