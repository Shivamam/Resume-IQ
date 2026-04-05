import { create } from 'zustand';

const useCandidatesStore = create((set) => ({
  candidates: [],
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 1,
  loading: false,
  error: null,
  selected: new Set(),
  // Filters
  filters: {
    min_experience: '',
    max_experience: '',
    skills: '',
    education: '',
    location: '',
    college: '',
    min_gpa: '',
    max_gpa: '',
    employment_gap: '',
    uploaded_from: '',
    uploaded_to: '',
  },

  // Sorting
  sortBy: 'uploaded_at',
  sortOrder: 'desc',

  // JD matching
  sessionId: null,
  minScore: 60,
  scoring: false,
  scoringProgress: null,

  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setFilters: (filters) => set({ filters, page: 1 }),
  resetFilters: () =>
    set({
      filters: {
        min_experience: '',
        max_experience: '',
        skills: '',
        education: '',
        location: '',
        college: '',
        min_gpa: '',
        max_gpa: '',
        employment_gap: '',
        uploaded_from: '',
        uploaded_to: '',
      },
      page: 1,
    }),
  setPage: (page) => set({ page }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setSession: (sessionId) => set({ sessionId, minScore: 60 }),
  setMinScore: (minScore) => set({ minScore }),
  clearSession: () => set({ sessionId: null, scoringProgress: null }),
  setScoring: (scoring) => set({ scoring }),
  setScoringProgress: (scoringProgress) => set({ scoringProgress }),
  setCandidates: (data) =>
    set({
      candidates: data.results,
      total: data.total,
      totalPages: data.total_pages,
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selected);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selected: next };
    }),
  toggleSelectAll: (candidates) =>
    set((state) => {
      const allSelected = candidates.every((c) =>
        state.selected.has(c.resume_id),
      );
      if (allSelected) {
        const next = new Set(state.selected);
        candidates.forEach((c) => next.delete(c.resume_id));
        return { selected: next };
      } else {
        const next = new Set(state.selected);
        candidates.forEach((c) => next.add(c.resume_id));
        return { selected: next };
      }
    }),
  clearSelected: () => set({ selected: new Set() }),
}));

export default useCandidatesStore;
