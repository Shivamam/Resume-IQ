import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { matchJD } from '../api/candidates';
import useCandidatesStore from '../store/candidatesStore';
import useAuthStore from '../store/authStore';

export default function JDMatchPanel() {
  const [tab, setTab] = useState('text'); // 'text' or 'file'
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const {
    sessionId,
    minScore,
    scoring,
    scoringProgress,
    setSession,
    setMinScore,
    clearSession,
    setScoring,
    setScoringProgress,
  } = useCandidatesStore();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    maxFiles: 1,
    onDrop: (accepted) => setJdFile(accepted[0] || null),
  });

  const handleMatch = async () => {
    if (tab === 'text' && !jdText.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (tab === 'file' && !jdFile) {
      setError('Please upload a JD file');
      return;
    }

    setError(null);
    setScoring(true);
    clearSession();

    const formData = new FormData();
    if (tab === 'text') {
      formData.append('text', jdText.trim());
    } else {
      formData.append('file', jdFile);
    }

    try {
      const res = await matchJD(formData);
      const { session_id } = res.data;
      setSession(session_id);
      connectWebSocket(session_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start matching');
      setScoring(false);
    }
  };

  const connectWebSocket = (sessionId) => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(
      `ws://localhost:8000/ws/jd/${sessionId}?token=${accessToken}`,
    );

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.status === 'completed') {
        setScoring(false);
        setScoringProgress({ scored: data.scored, total: data.total });
        ws.close();
      } else if (data.status === 'not_found') {
        setError('Session expired');
        setScoring(false);
      } else {
        setScoringProgress({
          scored: data.scored,
          total: data.total,
          progress: data.progress,
          latestScore: data.score,
        });
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
      setScoring(false);
    };

    wsRef.current = ws;
  };

  const handleClear = () => {
    clearSession();
    setJdText('');
    setJdFile(null);
    setError(null);
    if (wsRef.current) wsRef.current.close();
  };

  return (
    <div className='card p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700'>JD Match</h3>
        {sessionId && (
          <button
            onClick={handleClear}
            className='text-xs text-gray-400 hover:text-gray-600'
          >
            Clear
          </button>
        )}
      </div>

      <div className='flex rounded-lg border border-gray-200 overflow-hidden'>
        {['text', 'file'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-[#4f46e5] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'text' ? 'Paste text' : 'Upload file'}
          </button>
        ))}
      </div>

      {tab === 'text' ? (
        <textarea
          className='input text-xs resize-none'
          rows={6}
          placeholder='Paste job description here...'
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          disabled={scoring}
        />
      ) : (
        <div
          {...getRootProps()}
          className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#4f46e5] transition-colors'
        >
          <input {...getInputProps()} />
          {jdFile ? (
            <p className='text-sm text-gray-700 font-medium'>{jdFile.name}</p>
          ) : (
            <p className='text-xs text-gray-400'>Drop PDF or DOCX here</p>
          )}
        </div>
      )}

      {error && (
        <p className='text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg'>
          {error}
        </p>
      )}

      {scoring && scoringProgress && (
        <div className='space-y-2'>
          <div className='flex justify-between text-xs text-gray-500'>
            <span>Scoring candidates...</span>
            <span>
              {scoringProgress.scored}/{scoringProgress.total}
            </span>
          </div>
          <div className='w-full bg-gray-100 rounded-full h-1.5'>
            <div
              className='bg-[#4f46e5] h-1.5 rounded-full transition-all'
              style={{ width: `${scoringProgress.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {sessionId && !scoring && scoringProgress && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-3 space-y-3'>
          <div className='flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-green-500' />
            <p className='text-xs font-medium text-green-700'>
              Scored {scoringProgress.scored} candidates
            </p>
          </div>
          <div>
            <div className='flex justify-between text-xs text-gray-600 mb-1'>
              <span>Min score threshold</span>
              <span className='font-semibold text-[#4f46e5]'>{minScore}</span>
            </div>
            <input
              type='range'
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className='w-full accent-[#4f46e5]'
            />
            <div className='flex justify-between text-xs text-gray-400 mt-0.5'>
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}

      {!sessionId && (
        <button
          onClick={handleMatch}
          disabled={scoring}
          className='btn-primary w-full text-sm py-2 flex items-center justify-center gap-2'
        >
          {scoring ? (
            <>
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
              Scoring...
            </>
          ) : (
            'Match candidates'
          )}
        </button>
      )}
    </div>
  );
}
