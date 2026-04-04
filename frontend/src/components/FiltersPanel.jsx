import { useState } from 'react';
import useCandidatesStore from '../store/candidatesStore';

export default function FiltersPanel() {
  const { filters, setFilters, resetFilters } = useCandidatesStore();
  const [local, setLocal] = useState(filters);

  const handleChange = (e) => {
    setLocal({ ...local, [e.target.name]: e.target.value });
  };

  const handleApply = () => setFilters(local);
  const handleReset = () => {
    const empty = Object.fromEntries(Object.keys(local).map((k) => [k, '']));
    setLocal(empty);
    resetFilters();
  };

  return (
    <div className='card p-4 space-y-4'>
      <h3 className='text-sm font-semibold text-gray-700'>Filters</h3>

      {/* Experience */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          Years of experience
        </label>
        <div className='flex gap-2'>
          <input
            className='input text-xs'
            type='number'
            name='min_experience'
            placeholder='Min'
            value={local.min_experience}
            onChange={handleChange}
            min={0}
          />
          <input
            className='input text-xs'
            type='number'
            name='max_experience'
            placeholder='Max'
            value={local.max_experience}
            onChange={handleChange}
            min={0}
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          Skills
        </label>
        <input
          className='input text-xs'
          type='text'
          name='skills'
          placeholder='Python, React, Docker'
          value={local.skills}
          onChange={handleChange}
        />
        <p className='text-xs text-gray-400 mt-1'>Comma separated</p>
      </div>

      {/* Education */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          Education level
        </label>
        <select
          className='input text-xs'
          name='education'
          value={local.education}
          onChange={handleChange}
        >
          <option value=''>Any</option>
          <option value='Bachelor'>Bachelor's</option>
          <option value='Master'>Master's</option>
          <option value='PhD'>PhD</option>
          <option value='Diploma'>Diploma</option>
        </select>
      </div>

      {/* Location */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          Location
        </label>
        <input
          className='input text-xs'
          type='text'
          name='location'
          placeholder='Mumbai, Delhi...'
          value={local.location}
          onChange={handleChange}
        />
      </div>

      {/* College */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          College name
        </label>
        <input
          className='input text-xs'
          type='text'
          name='college'
          placeholder='Search college...'
          value={local.college}
          onChange={handleChange}
        />
      </div>

      {/* GPA */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          GPA range
        </label>
        <div className='flex gap-2'>
          <input
            className='input text-xs'
            type='number'
            name='min_gpa'
            placeholder='Min'
            value={local.min_gpa}
            onChange={handleChange}
            min={0}
            max={10}
            step={0.1}
          />
          <input
            className='input text-xs'
            type='number'
            name='max_gpa'
            placeholder='Max'
            value={local.max_gpa}
            onChange={handleChange}
            min={0}
            max={10}
            step={0.1}
          />
        </div>
      </div>

      {/* Employment gap */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          Employment gap
        </label>
        <select
          className='input text-xs'
          name='employment_gap'
          value={local.employment_gap}
          onChange={handleChange}
        >
          <option value=''>All candidates</option>
          <option value='true'>With gaps only</option>
          <option value='false'>No gaps only</option>
        </select>
      </div>

      {/* Upload date */}
      <div>
        <label className='block text-xs font-medium text-gray-600 mb-1'>
          Upload date range
        </label>
        <div className='space-y-2'>
          <input
            className='input text-xs'
            type='date'
            name='uploaded_from'
            value={local.uploaded_from}
            onChange={handleChange}
          />
          <input
            className='input text-xs'
            type='date'
            name='uploaded_to'
            value={local.uploaded_to}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-2 pt-2'>
        <button
          onClick={handleApply}
          className='btn-primary flex-1 text-sm py-1.5'
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className='btn-secondary flex-1 text-sm py-1.5'
        >
          Reset
        </button>
      </div>
    </div>
  );
}
