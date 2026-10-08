import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberSetting } from './NumberSetting';

describe('NumberSetting', () => {
  it('commits a valid number on blur', async () => {
    const onCommit = vi.fn();
    render(
      <NumberSetting
        id="x"
        label="Min. deposits"
        value={3}
        draft="4"
        step={1}
        onDraft={vi.fn()}
        onCommit={onCommit}
      />,
    );
    await userEvent.click(screen.getByLabelText('Min. deposits'));
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(4);
  });

  it('restores the value for invalid input', async () => {
    const onDraft = vi.fn();
    const onCommit = vi.fn();
    render(
      <NumberSetting
        id="x"
        label="Window"
        value={30}
        draft=""
        step={1}
        onDraft={onDraft}
        onCommit={onCommit}
      />,
    );
    await userEvent.click(screen.getByLabelText('Window'));
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDraft).toHaveBeenCalledWith('30');
  });
});
