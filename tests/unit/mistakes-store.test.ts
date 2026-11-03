import { useMistakesStore } from '@stores/mistakes';

const base = { surah: 100, ayah: 9, excerpt: 'أَفَلَا' };

const reset = () => useMistakesStore.setState({ marks: [], lastRemoved: null }, false);

const store = () => useMistakesStore.getState();

describe('mistakes store', () => {
  beforeEach(reset);

  it('starts empty', () => {
    expect(store().marks).toEqual([]);
  });

  it('adds a mark and stamps it', () => {
    const added = store().addMark({ ...base, from: 2, to: 5 });
    expect(store().marks).toHaveLength(1);
    expect(added.id).toMatch(/^mk_/);
    expect(added.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(added).toMatchObject({ surah: 100, ayah: 9, from: 2, to: 5 });
  });

  it('normalises a backwards range', () => {
    const added = store().addMark({ ...base, from: 9, to: 4 });
    expect(added).toMatchObject({ from: 4, to: 9 });
  });

  it('gives every mark a distinct id', () => {
    const a = store().addMark({ ...base, from: 0, to: 0 });
    const b = store().addMark({ ...base, ayah: 10, from: 0, to: 0 });
    expect(a.id).not.toBe(b.id);
  });

  it('merges a new mark into an overlapping one on the same ayah', () => {
    store().addMark({ ...base, from: 2, to: 5 });
    store().addMark({ ...base, from: 4, to: 8 });
    expect(store().marks).toHaveLength(1);
    expect(store().marks[0]).toMatchObject({ from: 2, to: 8 });
  });

  it('merges several overlapping marks at once', () => {
    store().addMark({ ...base, from: 0, to: 2 });
    store().addMark({ ...base, from: 6, to: 8 });
    expect(store().marks).toHaveLength(2);
    store().addMark({ ...base, from: 1, to: 7 });
    expect(store().marks).toHaveLength(1);
    expect(store().marks[0]).toMatchObject({ from: 0, to: 8 });
  });

  it('keeps marks on different ayat separate even when ranges overlap', () => {
    store().addMark({ ...base, ayah: 9, from: 2, to: 5 });
    store().addMark({ ...base, ayah: 10, from: 2, to: 5 });
    expect(store().marks).toHaveLength(2);
  });

  it('treats adjacent-but-not-overlapping ranges as separate', () => {
    store().addMark({ ...base, from: 0, to: 2 });
    store().addMark({ ...base, from: 4, to: 6 });
    expect(store().marks).toHaveLength(2);
  });

  it('removes a mark by id', () => {
    const added = store().addMark({ ...base, from: 2, to: 5 });
    store().removeMark(added.id);
    expect(store().marks).toHaveLength(0);
  });

  it('restores the last removed mark', () => {
    const added = store().addMark({ ...base, from: 2, to: 5 });
    store().removeMark(added.id);
    expect(store().marks).toHaveLength(0);

    store().restoreLastRemoved();
    expect(store().marks).toHaveLength(1);
    expect(store().marks[0]).toMatchObject({ id: added.id, from: 2, to: 5 });
  });

  it('only restores once', () => {
    const added = store().addMark({ ...base, from: 2, to: 5 });
    store().removeMark(added.id);
    store().restoreLastRemoved();
    store().restoreLastRemoved();
    expect(store().marks).toHaveLength(1);
  });

  it('is a no-op to restore when nothing was removed', () => {
    store().addMark({ ...base, from: 2, to: 5 });
    store().restoreLastRemoved();
    expect(store().marks).toHaveLength(1);
  });

  it('ignores removal of an unknown id', () => {
    store().addMark({ ...base, from: 2, to: 5 });
    store().removeMark('nope');
    expect(store().marks).toHaveLength(1);
  });

  it('attaches a note', () => {
    const added = store().addMark({ ...base, from: 2, to: 5 });
    store().setNote(added.id, 'madd too short');
    expect(store().marks[0]?.note).toBe('madd too short');
  });

  it('clears every mark on one ayah', () => {
    store().addMark({ ...base, ayah: 9, from: 0, to: 1 });
    store().addMark({ ...base, ayah: 9, from: 5, to: 6 });
    store().addMark({ ...base, ayah: 10, from: 0, to: 1 });
    store().clearAyah(100, 9);
    expect(store().marks).toHaveLength(1);
    expect(store().marks[0]?.ayah).toBe(10);
  });

  it('clears everything', () => {
    store().addMark({ ...base, from: 0, to: 1 });
    store().addMark({ ...base, ayah: 10, from: 0, to: 1 });
    store().clearAll();
    expect(store().marks).toEqual([]);
  });
});
