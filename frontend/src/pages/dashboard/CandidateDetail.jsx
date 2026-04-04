import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCandidateDetail, getResume } from '../../api/resumes'
import SkillsSection from '../../components/SkillsSection'
import WorkHistory from '../../components/WorkHistory'
import EducationSection from '../../components/EducationSection'

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [parsed, setParsed] = useState(null)
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [parsedRes, resumeRes] = await Promise.all([
          getCandidateDetail(id),
          getResume(id),
        ])
        setParsed(parsedRes.data)
        setResume(resumeRes.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load candidate')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-[#4f46e5]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          Back to dashboard
        </button>
      </div>
    )
  }

  const projects = (() => {
    try { return JSON.parse(parsed.projects || '[]') } catch { return [] }
  })()

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => navigate('/dashboard')}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              {parsed.full_name || 'Unknown Candidate'}
            </h1>
            <p className='text-sm text-gray-500 mt-0.5'>
              {[parsed.current_job_title, parsed.current_company]
                .filter(Boolean)
                .join(' at ')}
            </p>
          </div>
        </div>
        {/* Open PDF button */}
        {resume?.file_url && (
          <a
            href={resume.file_url}
            target='_blank'
            rel='noopener noreferrer'
            className='btn-primary flex items-center gap-2 text-sm'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
              />
            </svg>
            Open Resume
          </a>
        )}
      </div>

      {/* Personal info */}
      <Section title='Personal information'>
        <div className='grid grid-cols-3 gap-x-6 gap-y-4'>
          <InfoRow label='Email' value={parsed.email} />
          <InfoRow label='Phone' value={parsed.phone} />
          <InfoRow
            label='Location'
            value={[parsed.city, parsed.state].filter(Boolean).join(', ')}
          />
          <InfoRow label='Age' value={parsed.age} />
          <InfoRow label='Gender' value={parsed.gender} />
          <InfoRow label='Notice period' value={parsed.notice_period} />
          <InfoRow label='Expected salary' value={parsed.expected_salary} />
          {parsed.linkedin_url && (
            <div>
              <p className='text-xs text-gray-400'>LinkedIn</p>
              <a
                href={parsed.linkedin_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-[#4f46e5] hover:underline mt-0.5 block truncate'
              >
                View profile
              </a>
            </div>
          )}
          {parsed.github_url && (
            <div>
              <p className='text-xs text-gray-400'>GitHub</p>
              <a
                href={parsed.github_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-[#4f46e5] hover:underline mt-0.5 block truncate'
              >
                View profile
              </a>
            </div>
          )}
        </div>
      </Section>

      {/* Work experience */}
      <Section
        title={`Work experience · ${parsed.total_experience_years || 'N/A'}`}
      >
        {parsed.employment_gap_flag && (
          <div className='mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg'>
            <svg
              className='w-4 h-4 text-amber-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
              />
            </svg>
            <p className='text-xs font-medium text-amber-700'>
              Employment gap detected
            </p>
          </div>
        )}
        <WorkHistory workJson={parsed.work_history} />
      </Section>

      {/* Education */}
      <Section title='Education'>
        <EducationSection data={parsed} />
      </Section>

      {/* Skills */}
      <Section title='Skills'>
        <SkillsSection skillsJson={parsed.skills} />
      </Section>

      {/* Projects */}
      {projects.length > 0 && (
        <Section title='Projects'>
          <div className='space-y-4'>
            {projects.map((project, i) => (
              <div key={i} className='p-4 bg-gray-50 rounded-lg'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='font-medium text-gray-900 text-sm'>
                      {project.name || '—'}
                    </p>
                    <p className='text-sm text-gray-500 mt-1'>
                      {project.description || ''}
                    </p>
                  </div>
                  {project.project_type && (
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.project_type === 'professional'
                          ? 'bg-[#eef2ff] text-[#4f46e5]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {project.project_type}
                    </span>
                  )}
                </div>
                {project.technologies?.length > 0 && (
                  <div className='flex flex-wrap gap-1.5 mt-3'>
                    {project.technologies.map((tech, j) => (
                      <span
                        key={j}
                        className='px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded'
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}