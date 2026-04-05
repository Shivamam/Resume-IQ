import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidates, getCandidatesByIds } from '../api/candidates';
import useCandidatesStore from '../store/candidatesStore';

const ALL_COLUMNS = [
  { key: 'name', label: 'Name', always: true },
  { key: 'email', label: 'Email' },
  { key: 'location', label: 'Location' },
  { key: 'experience', label: 'Experience' },
  { key: 'last_role', label: 'Last Role' },
  { key: 'last_company', label: 'Last Company' },
  { key: 'skills', label: 'Top Skills' },
  { key: 'education', label: 'Education' },
  { key: 'college', label: 'College' },
  { key: 'match_score', label: 'Match Score', jdOnly: true },
  { key: 'uploaded_at', label: 'Upload Date' },
  { key: 'status', label: 'Status' },
];

function SkillTags({ skillsJson }) {
  if (!skillsJson) return <span className='text-gray-400 text-xs'>—</span>;
  try {
    const skills = JSON.parse(skillsJson);
    const all = [
      ...(skills.programming_languages || []),
      ...(skills.frameworks_and_libraries || []),
    ].slice(0, 3);
    if (!all.length) return <span className='text-gray-400 text-xs'>—</span>;
    return (
      <div className='flex flex-wrap gap-1'>
        {all.map((s, i) => (
          <span
            key={i}
            className='px-1.5 py-0.5 bg-[#eef2ff] text-[#4f46e5] text-xs rounded font-medium'
          >
            {s}
          </span>
        ))}
      </div>
    );
  } catch {
    return <span className='text-gray-400 text-xs'>—</span>;
  }
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined)
    return <span className='text-gray-400 text-xs'>—</span>;
  const color =
    score >= 75
      ? 'bg-green-100 text-green-700'
      : score >= 50
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = {
    completed: { label: 'Parsed', color: 'bg-green-100 text-green-700' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
    queued: { label: 'Queued', color: 'bg-amber-100 text-amber-700' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  };
  const c = config[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

function renderCell(col, c) {
  switch (col.key) {
    case 'name':
      return <p className='font-medium text-gray-900'>{c.full_name || '—'}</p>;
    case 'email':
      return <span className='text-gray-600 text-xs'>{c.email || '—'}</span>;
    case 'location':
      return (
        <span className='text-gray-600 text-sm'>
          {[c.city, c.state].filter(Boolean).join(', ') || '—'}
        </span>
      );
    case 'experience':
      return (
        <span className='text-gray-600 text-sm whitespace-nowrap'>
          {c.total_experience_years || '—'}
        </span>
      );
    case 'last_role':
      return (
        <span className='text-gray-600 text-sm'>
          {c.current_job_title || '—'}
        </span>
      );
    case 'last_company':
      return (
        <span className='text-gray-600 text-sm'>
          {c.current_company || '—'}
        </span>
      );
    case 'skills':
      return <SkillTags skillsJson={c.skills} />;
    case 'education':
      return (
        <span className='text-gray-600 text-sm'>{c.highest_degree || '—'}</span>
      );
    case 'college':
      return (
        <span className='text-gray-600 text-sm truncate max-w-32 block'>
          {c.university || '—'}
        </span>
      );
    case 'match_score':
      return <ScoreBadge score={c.match_score} />;
    case 'uploaded_at':
      return (
        <span className='text-gray-400 text-xs whitespace-nowrap'>
          {new Date(c.uploaded_at).toLocaleDateString()}
        </span>
      );
    case 'status':
      return <StatusBadge status={c.status} />;
    default:
      return '—';
  }
}

export default function CandidatesTable() {
  const navigate = useNavigate();
  const {
    candidates,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    filters,
    sortBy,
    sortOrder,
    sessionId,
    minScore,
    selected,
    setPage,
    setSort,
    setPageSize,
    setCandidates,
    setLoading,
    setError,
    toggleSelect,
    toggleSelectAll,
    clearSelected,
  } = useCandidatesStore();

  const [visibleCols, setVisibleCols] = useState(
    ALL_COLUMNS.filter((c) => !c.jdOnly).map((c) => c.key),
  );
  const [showColPicker, setShowColPicker] = useState(false);

  const toggleCol = (key) => {
    setVisibleCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(sessionId && { session_id: sessionId, min_score: minScore }),
      };
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null) params[key] = val;
      });
      const res = await getCandidates(params);
      setCandidates(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, pageSize, filters, sortBy, sortOrder, sessionId, minScore]);

  const activeCols = ALL_COLUMNS.filter((col) => {
    if (col.jdOnly) return !!sessionId;
    if (col.always) return true;
    return visibleCols.includes(col.key);
  });

  const sortableFields = [
    'name',
    'email',
    'location',
    'experience',
    'last_role',
    'last_company',
    'education',
    'college',
    'match_score',
    'uploaded_at',
    'status',
  ];

  const handleSort = (field) => {
    if (!sortableFields.includes(field)) return;
    setSort(field, sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const allOnPageSelected =
    candidates.length > 0 && candidates.every((c) => selected.has(c.resume_id));

const exportCSV = async () => {
  if (!selected.size) return;

  let rows = [];

  // Check if all selected are on current page
  const currentPageSelected = candidates.filter((c) =>
    selected.has(c.resume_id),
  );

  if (currentPageSelected.length === selected.size) {
    // All selected are on current page — no extra fetch needed
    rows = currentPageSelected;
  } else {
    // Selected spans multiple pages — fetch all by ID
    try {
      const ids = Array.from(selected);
      const res = await getCandidatesByIds(ids);
      rows = res.data.results;
    } catch {
      alert('Failed to fetch selected candidates for export');
      return;
    }
  }

  if (!rows.length) return;

  const headers = activeCols.map((col) => col.label);

  const getCellValue = (col, c) => {
    switch (col.key) {
      case 'name':
        return c.full_name || '';
      case 'email':
        return c.email || '';
      case 'location':
        return [c.city, c.state].filter(Boolean).join(', ');
      case 'experience':
        return c.total_experience_years || '';
      case 'last_role':
        return c.current_job_title || '';
      case 'last_company':
        return c.current_company || '';
      case 'skills': {
        try {
          const s = JSON.parse(c.skills || '{}');
          return [
            ...(s.programming_languages || []),
            ...(s.frameworks_and_libraries || []),
          ]
            .slice(0, 5)
            .join(', ');
        } catch {
          return '';
        }
      }
      case 'education':
        return c.highest_degree || '';
      case 'college':
        return c.university || '';
      case 'match_score':
        return c.match_score ?? '';
      case 'uploaded_at':
        return new Date(c.uploaded_at).toLocaleDateString();
      case 'status':
        return c.status || '';
      default:
        return '';
    }
  };

  const csvRows = [
    headers.join(','),
    ...rows.map((c) =>
      activeCols
        .map((col) => {
          const val = getCellValue(col, c);
          return typeof val === 'string' &&
            (val.includes(',') || val.includes('\n'))
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(','),
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

  if (loading) {
    return (
      <div className='card flex items-center justify-center h-64'>
        <div className='flex flex-col items-center gap-3 text-gray-400'>
          <svg className='w-8 h-8 animate-spin' fill='none' viewBox='0 0 24 24'>
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8v8H4z'
            />
          </svg>
          <span className='text-sm'>Loading candidates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='card flex items-center justify-center h-64'>
        <p className='text-red-500 text-sm'>{error}</p>
      </div>
    );
  }

  return (
    <div className='card overflow-hidden'>
      {/* Toolbar */}
      <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-3'>
          <span className='text-sm font-medium text-gray-700'>
            {total} candidate{total !== 1 ? 's' : ''}
            {sessionId && (
              <span className='text-[#4f46e5] ml-2'>· JD match active</span>
            )}
          </span>
          {selected.size > 0 && (
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500'>
                {selected.size} selected
                {selected.size >
                candidates.filter((c) => selected.has(c.resume_id)).length
                  ? ' across pages'
                  : ''}
              </span>
              <button
                onClick={clearSelected}
                className='text-xs text-gray-400 hover:text-gray-600'
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {/* Export CSV */}
          {selected.size > 0 && (
            <button
              onClick={exportCSV}
              className='btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5'
            >
              <svg
                className='w-3.5 h-3.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
              Export {selected.size} to CSV
            </button>
          )}

          {/* Show/hide columns */}
          <div className='relative'>
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className='btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5'
            >
              <svg
                className='w-3.5 h-3.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2'
                />
              </svg>
              Columns
            </button>

            {showColPicker && (
              <div className='absolute right-0 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2'>
                {ALL_COLUMNS.filter((c) => !c.always && !c.jdOnly).map(
                  (col) => (
                    <label
                      key={col.key}
                      className='flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={visibleCols.includes(col.key)}
                        onChange={() => toggleCol(col.key)}
                        className='accent-[#4f46e5]'
                      />
                      <span className='text-sm text-gray-700'>{col.label}</span>
                    </label>
                  ),
                )}
                <div className='border-t border-gray-100 mt-1 pt-1'>
                  <button
                    onClick={() => setShowColPicker(false)}
                    className='w-full text-xs text-gray-400 hover:text-gray-600 py-1'
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-64 text-gray-400'>
          <svg
            className='w-12 h-12 mb-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
          <p className='text-sm'>No candidates found</p>
          <p className='text-xs mt-1'>Try adjusting your filters</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 border-b border-gray-100'>
              <tr>
                <th className='pl-4 pr-2 py-3 w-8'>
                  <input
                    type='checkbox'
                    checked={allOnPageSelected}
                    onChange={() => toggleSelectAll(candidates)}
                    className='accent-[#4f46e5]'
                  />
                </th>
                {activeCols.map((col) => (
                  <th
                    key={col.key}
                    onClick={() =>
                      sortableFields.includes(col.key) && handleSort(col.key)
                    }
                    className={`text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                      sortableFields.includes(col.key)
                        ? 'cursor-pointer hover:text-gray-700 select-none'
                        : ''
                    }`}
                  >
                    {col.label}
                    {sortableFields.includes(col.key) && (
                      <span
                        className={`ml-1 ${sortBy === col.key ? 'text-[#4f46e5]' : 'text-gray-300'}`}
                      >
                        {sortBy === col.key
                          ? sortOrder === 'asc'
                            ? '↑'
                            : '↓'
                          : '↕'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {candidates.map((c) => (
                <tr
                  key={c.resume_id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selected.has(c.resume_id) ? 'bg-[#eef2ff]' : ''
                  }`}
                >
                  <td
                    className='pl-4 pr-2 py-3'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type='checkbox'
                      checked={selected.has(c.resume_id)}
                      onChange={() => toggleSelect(c.resume_id)}
                      className='accent-[#4f46e5]'
                    />
                  </td>
                  {activeCols.map((col) => (
                    <td
                      key={col.key}
                      className='px-4 py-3 cursor-pointer'
                      onClick={() => navigate(`/candidates/${c.resume_id}`)}
                    >
                      {renderCell(col, c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className='px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-500'>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className='text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#4f46e5]'
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <span className='text-xs text-gray-500'>
          Page {page} of {totalPages} · {total} total
        </span>

        <div className='flex gap-2'>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className='btn-secondary text-xs py-1 px-2 disabled:opacity-40'
          >
            «
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className='btn-secondary text-xs py-1 px-3 disabled:opacity-40'
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className='btn-secondary text-xs py-1 px-3 disabled:opacity-40'
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className='btn-secondary text-xs py-1 px-2 disabled:opacity-40'
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
