import { buildMrosSections, MROS_SECTIONS } from './mrosTemplate';
import type { ReportChunk, ReportDrafter, ReportInput } from './ReportDrafter';

export interface MockDrafterOptions {
  /** Delay per chunk in ms (≈ 30 ms by default, 0 in tests). */
  chunkDelayMs?: number;
  chunkSize?: number;
}

/** Splits text into chunks at word boundaries of roughly `size` characters. */
export function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const token of text.split(/(?<=\s)/)) {
    current += token;
    if (current.length >= size) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export class MockReportDrafter implements ReportDrafter {
  readonly id = 'mock-claude-report';
  private readonly delay: number;
  private readonly size: number;

  constructor(options: MockDrafterOptions = {}) {
    this.delay = options.chunkDelayMs ?? 30;
    this.size = options.chunkSize ?? 28;
  }

  sections(): { id: string; title: string }[] {
    return MROS_SECTIONS.map((s) => ({ ...s }));
  }

  async *draft(input: ReportInput): AsyncIterable<ReportChunk> {
    for (const section of buildMrosSections(input)) {
      for (const text of chunkText(section.body, this.size)) {
        if (this.delay > 0) await new Promise((r) => setTimeout(r, this.delay));
        yield { sectionId: section.id, text };
      }
    }
  }
}
