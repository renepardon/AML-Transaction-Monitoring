import { render, screen } from '@testing-library/react';
import { RuleChip } from './RuleChip';

describe('RuleChip', () => {
  it('shows the short id and name with a description tooltip', () => {
    render(<RuleChip ruleId="R2_PASS_THROUGH" />);
    expect(screen.getByText('Pass-through')).toBeInTheDocument();
    expect(screen.getByTitle(/R2 Pass-through: A large credit/)).toBeInTheDocument();
  });

  it('can be compact', () => {
    render(<RuleChip ruleId="R1_STRUCTURING" compact />);
    expect(screen.queryByText('Structuring')).not.toBeInTheDocument();
    expect(screen.getByText('R1')).toBeInTheDocument();
  });
});
