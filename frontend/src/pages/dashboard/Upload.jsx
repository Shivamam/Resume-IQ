import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import useResumeUpload from '../../hooks/useResumeUpload';

const statusConfig = {
  pending: { label: 'Ready', color: 'text-gray-500', bg: 'bg-gray-100' },
  queued: { label: 'Queued', color: 'text-amber-600', bg: 'bg-amber-50' },
  processing: { label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-50' },
  parsing: { label: 'Parsing', color: 'text-purple-600', bg: 'bg-purple-50' },
  completed: { label: 'Done', color: 'text-green-600', bg: 'bg-green-50' },
  failed: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50' },
  error: { label: 'Error', color: 'text-red-600', bg: 'bg-red-50' },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      {['queued', 'processing', 'parsing'].includes(status) && (
        <span className='w-1.5 h-1.5 rounded-full bg-current animate-pulse' />
      )}
      {config.label}
    </span>
  );
}

function FileIcon() {
  return (
    <svg
      className='w-8 h-8 text-red-400'
      fill='currentColor'
      viewBox='0 0 24 24'
    >
      <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z' />
    </svg>
  );
}

export default function Upload() {
  const { files, uploading, addFiles, removeFile, upload, reset } =
    useResumeUpload();

  const onDrop = useCallback(
    (accepted) => {
      addFiles(accepted);
    },
    [addFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 10,
    disabled: uploading,
  });

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'completed').length;
  const hasFiles = files.length > 0;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-[#4f46e5] bg-[#eef2ff]'
            : 'border-gray-300 hover:border-[#4f46e5] hover:bg-gray-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className='flex flex-col items-center gap-3'>
          <svg
            className='w-12 h-12 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
            />
          </svg>
          <div>
            <p className='text-gray-700 font-medium'>
              {isDragActive ? 'Drop PDFs here' : 'Drag and drop PDFs here'}
            </p>
            <p className='text-gray-400 text-sm mt-1'>
              or click to browse — max 10 files, 5MB each
            </p>
          </div>
        </div>
      </div>

      {hasFiles && (
        <div className='card overflow-hidden'>
          <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-700'>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
              {doneCount > 0 && (
                <span className='text-green-600 ml-2'>
                  · {doneCount} completed
                </span>
              )}
            </span>
            {!uploading && (
              <button
                onClick={reset}
                className='text-xs text-gray-400 hover:text-gray-600'
              >
                Clear all
              </button>
            )}
          </div>

          <ul className='divide-y divide-gray-100'>
            {files.map((item, index) => (
              <li key={index} className='flex items-center gap-4 px-4 py-3'>
                <FileIcon />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {item.file.name}
                  </p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {(item.file.size / 1024).toFixed(1)} KB
                    {item.error && (
                      <span className='text-red-500 ml-2'>{item.error}</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={item.status} />
                {!uploading && item.status === 'pending' && (
                  <button
                    onClick={() => removeFile(index)}
                    className='text-gray-300 hover:text-gray-500 ml-2'
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
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasFiles && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-gray-500'>
            {pendingCount > 0
              ? `${pendingCount} file${pendingCount !== 1 ? 's' : ''} ready to upload`
              : 'All files processed'}
          </p>
          <div className='flex gap-3'>
            {!uploading && pendingCount > 0 && (
              <button onClick={upload} className='btn-primary'>
                Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              </button>
            )}
            {uploading && (
              <button disabled className='btn-primary flex items-center gap-2'>
                <svg
                  className='w-4 h-4 animate-spin'
                  fill='none'
                  viewBox='0 0 24 24'
                >
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
                Uploading...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
