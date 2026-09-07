import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../../mocks/server.js';
import ProblemList from '../ProblemList.js';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProblemList', () => {
  it('renders fixture problems from the mocked API', async () => {
    render(
      <MemoryRouter>
        <ProblemList />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/Contaminated pond water/i)).toBeInTheDocument());
    expect(screen.getByText(/Large pothole on NH-33/i)).toBeInTheDocument();
  });
});
