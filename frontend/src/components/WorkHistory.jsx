export default function WorkHistory({ workJson }) {
  if (!workJson)
    return <p className='text-gray-400 text-sm'>No work history found</p>;

  let history = [];
  try {
    history = JSON.parse(workJson);
  } catch {
    return null;
  }
  if (!history.length)
    return <p className='text-gray-400 text-sm'>No work history found</p>;

  return (
    <div className='relative'>
      {/* Timeline line */}
      <div className='absolute left-2 top-2 bottom-2 w-px bg-gray-200' />

      <div className='space-y-6'>
        {history.map((job, i) => (
          <div key={i} className='relative pl-8'>
            {/* Timeline dot */}
            <div className='absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#4f46e5] bg-white' />

            <div>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='font-medium text-gray-900 text-sm'>
                    {job.job_title || '—'}
                  </p>
                  <p className='text-[#4f46e5] text-sm'>{job.company || '—'}</p>
                </div>
                <span className='text-xs text-gray-400 whitespace-nowrap shrink-0'>
                  {[job.start_date, job.end_date].filter(Boolean).join(' → ') ||
                    '—'}
                </span>
              </div>
              {job.description && (
                <p className='text-sm text-gray-500 mt-1'>{job.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
