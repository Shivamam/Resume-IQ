export default function SkillsSection({ skillsJson }) {
  if (!skillsJson) return null;

  let skills = {};
  try {
    skills = JSON.parse(skillsJson);
  } catch {
    return null;
  }

  const sections = [
    {
      label: 'Programming languages',
      key: 'programming_languages',
      color: 'bg-[#eef2ff] text-[#4f46e5]',
    },
    {
      label: 'Frameworks & libraries',
      key: 'frameworks_and_libraries',
      color: 'bg-purple-50 text-purple-700',
    },
    { label: 'Databases', key: 'databases', color: 'bg-blue-50 text-blue-700' },
    {
      label: 'Cloud platforms',
      key: 'cloud_platforms',
      color: 'bg-sky-50 text-sky-700',
    },
    { label: 'Tools', key: 'tools', color: 'bg-gray-100 text-gray-700' },
    {
      label: 'Languages spoken',
      key: 'languages_spoken',
      color: 'bg-green-50 text-green-700',
    },
  ];

  return (
    <div className='space-y-4'>
      {sections.map(({ label, key, color }) => {
        const items = skills[key] || [];
        if (!items.length) return null;
        return (
          <div key={key}>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-2'>
              {label}
            </p>
            <div className='flex flex-wrap gap-2'>
              {items.map((item, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
