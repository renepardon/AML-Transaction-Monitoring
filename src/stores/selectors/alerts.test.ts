import type { AlertView } from './alerts';
import { compareAlerts, filterAlerts } from './alerts';

const view = (id: string, score: number | null, extra: Partial<AlertView> = {}): AlertView => ({
  id,
  clientId: 'C1',
  clientName: 'X',
  ruleId: 'R3_PROFILE_DEVIATION',
  severity: 'medium',
  summary: '',
  status: 'done',
  score,
  explanation: null,
  recommendedAction: null,
  dismissed: false,
  dismissalReason: null,
  promoted: false,
  raisedAt: '',
  ...extra,
});

describe('alert selectors', () => {
  it('sorts by score descending with unscored last', () => {
    expect(
      [view('a', 2), view('b', null), view('c', 5)].sort(compareAlerts).map((v) => v.id),
    ).toEqual(['c', 'a', 'b']);
  });

  it('filters by rule, score and dismissal', () => {
    const list = [
      view('a', 2),
      view('b', 5, { ruleId: 'R1_STRUCTURING' }),
      view('c', 1, { dismissed: true }),
    ];
    expect(
      filterAlerts(list, { rules: [], scores: [], showDismissed: false }).map((v) => v.id),
    ).toEqual(['a', 'b']);
    expect(
      filterAlerts(list, { rules: ['R1_STRUCTURING'], scores: [], showDismissed: true }).map(
        (v) => v.id,
      ),
    ).toEqual(['b']);
    expect(
      filterAlerts(list, { rules: [], scores: [1, 2], showDismissed: true }).map((v) => v.id),
    ).toEqual(['a', 'c']);
  });
});
