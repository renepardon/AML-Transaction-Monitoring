import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasonField } from './ReasonField';

describe('ReasonField', () => {
  it('shows a min-length counter and the recording actor', async () => {
    const onChange = vi.fn();
    render(
      <ReasonField
        id="r"
        label="Reason"
        value="  abc "
        onChange={onChange}
        actorLabel="A. Keller – AML Analyst"
      />,
    );
    expect(screen.getByText('3 / 10 min. characters')).toBeInTheDocument();
    expect(screen.getByText('Recorded as A. Keller – AML Analyst')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Reason'), 'x');
    expect(onChange).toHaveBeenCalled();
  });
});
