import { sampleTriageInputs } from '@/test/sampleTriage';
import { answerFollowUp, detectIntent, type FollowUpContext } from './followUp';

describe('follow-up answers', () => {
  let ctx: FollowUpContext;
  beforeAll(async () => {
    const inputs = (await sampleTriageInputs()).filter((i) => i.client.clientId === 'C1003');
    const first = inputs[0]!;
    ctx = {
      client: first.client,
      hits: first.clientHits,
      transactions: first.transactions,
      monthly: first.monthly,
      caseScore: 5,
      otherCases: [{ clientName: 'Elsa Brunner', rules: ['Pass-through', 'Risk country'] }],
    };
  });

  it('detects intents by keyword', () => {
    expect(detectIntent('Which countries?')).toBe('countries');
    expect(detectIntent('Why is the score 5?')).toBe('why_score');
    expect(detectIntent('show me the timeline')).toBe('timeline');
    expect(detectIntent('compare with the profile')).toBe('profile');
    expect(detectIntent('similar cases?')).toBe('similar');
    expect(detectIntent('hello')).toBe('help');
  });

  it('answers with facts from the data', () => {
    expect(answerFollowUp(ctx, 'countries')).toMatch(
      /Hong Kong \(HK\).*Internal risk list – demo policy, not expected/,
    );
    expect(answerFollowUp(ctx, 'timeline')).toMatch(
      /14 Jul \+CHF\s250.000 from Eastgate Holdings Ltd/,
    );
    expect(answerFollowUp(ctx, 'profile')).toMatch(/Handel mit Haushaltswaren/);
    expect(answerFollowUp(ctx, 'why score')).toMatch(/case score is 5\/5/);
    expect(answerFollowUp(ctx, 'similar')).toMatch(
      /Elsa Brunner: shares Pass-through, Risk country/,
    );
    expect(answerFollowUp(ctx, '???')).toMatch(/countries involved/);
  });
});
