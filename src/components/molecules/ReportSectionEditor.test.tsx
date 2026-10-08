import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportSectionEditor } from './ReportSectionEditor';

const section = { id: 'summary', title: '3. Summary of the suspicion', body: 'Original text.' };
const noop = () => {};

describe('ReportSectionEditor', () => {
  it('shows the body with an edit button when editable', async () => {
    const onEdit = vi.fn();
    render(
      <ReportSectionEditor
        section={section}
        draft={undefined}
        editable
        streaming={false}
        onEdit={onEdit}
        onChange={noop}
        onSave={noop}
        onCancel={noop}
      />,
    );
    expect(screen.getByText('Original text.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit 3. Summary of the suspicion' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('edits through callbacks and disables save without changes', async () => {
    const onChange = vi.fn();
    render(
      <ReportSectionEditor
        section={section}
        draft="Original text."
        editable
        streaming={false}
        onEdit={noop}
        onChange={onChange}
        onSave={noop}
        onCancel={noop}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save section' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: '3. Summary of the suspicion' }), '!');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows a streaming caret while generating', () => {
    const { container } = render(
      <ReportSectionEditor
        section={section}
        draft={undefined}
        editable={false}
        streaming
        onEdit={noop}
        onChange={noop}
        onSave={noop}
        onCancel={noop}
      />,
    );
    expect(container.querySelector('.streaming-caret')).not.toBeNull();
  });
});
