import { describe, expect, it } from 'vitest';
import { buildQuerySelectionUrl } from '../lib/useUrlQueryState';

describe('selector URL state', () => {
  it('updates a view and clears its old event in one destination', () => {
    expect(buildQuerySelectionUrl('/gate?view=archive&event=A&lang=en#details', 'view', 'upcoming', { event: '' }))
      .toBe('/gate?view=upcoming&lang=en#details');
  });
  it('adds and replaces one encoded selector while preserving other state and hash', () => {
    expect(buildQuerySelectionUrl(
      'https://terminal.test/gate?view=archive#details',
      'event',
      'TRM 01',
    )).toBe('/gate?view=archive&event=TRM+01#details');
  });

  it('removes an empty selector without dropping unrelated query values', () => {
    expect(buildQuerySelectionUrl('/lineup?lang=ko&event=TRM-01', 'event', ''))
      .toBe('/lineup?lang=ko');
  });
});
