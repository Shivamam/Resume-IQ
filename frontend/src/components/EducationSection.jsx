export default function EducationSection({ data }) {
  const fields = [
    { label: 'Highest degree', value: data.highest_degree },
    { label: 'Field of study', value: data.field_of_study },
    { label: 'University', value: data.university },
    { label: 'Graduation year', value: data.graduation_year },
    { label: 'GPA', value: data.gpa },
    {
      label: '10th percentage',
      value: data.tenth_percentage
        ? `${data.tenth_percentage} (${data.tenth_board || 'Board N/A'})`
        : null,
    },
    {
      label: '12th percentage',
      value: data.twelfth_percentage
        ? `${data.twelfth_percentage} (${data.twelfth_board || 'Board N/A'})`
        : null,
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className='text-xs text-gray-400'>{label}</p>
          <p className='text-sm font-medium text-gray-900 mt-0.5'>
            {value || '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
