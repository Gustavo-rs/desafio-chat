import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PublicRoute } from '../../components/PublicRoute';

const mockUseUser = vi.fn();
vi.mock('@/store/auth-store', () => ({
  useUser: () => mockUseUser(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div data-testid="navigate">{`Redirecting to ${to}`}</div>;
    },
  };
});

const TestComponent = () => <div data-testid="public-content">Public Content</div>;

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o loading quando isLoading for true', () => {
    mockUseUser.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('deve renderizar o conteúdo público quando não autenticado', () => {
    mockUseUser.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('deve redirecionar para /home quando autenticado', () => {
    mockUseUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to /home')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/home');
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  it('deve ter spinner com classes CSS corretas durante loading', () => {
    mockUseUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    const container = document.querySelector('.flex.items-center.justify-center.min-h-screen');
    expect(container).toBeInTheDocument();
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-primary');
  });
}); 