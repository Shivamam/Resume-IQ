import { useState, useRef } from 'react';
import { uploadResumes } from '../api/resumes';
import useAuthStore from '../store/authStore';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

export default function useResumeUpload() {
  const [files, setFiles] = useState([]); // { file, status, id, error }
  const [uploading, setUploading] = useState(false);
  const wsRef = useRef(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const validateFiles = (incoming) => {
    const results = [];
    for (const file of incoming) {
      if (file.type !== 'application/pdf') {
        results.push({ file, status: 'error', error: 'Not a PDF' });
      } else if (file.size > MAX_SIZE) {
        results.push({ file, status: 'error', error: 'Exceeds 5MB' });
      } else {
        results.push({ file, status: 'pending', error: null });
      }
    }
    return results;
  };

  const addFiles = (incoming) => {
    const validated = validateFiles(incoming);
    setFiles((prev) => {
      const combined = [...prev, ...validated];
      return combined.slice(0, MAX_FILES);
    });
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileStatus = (resumeId, status, extra = {}) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.resumeId === resumeId ? { ...f, status, ...extra } : f,
      ),
    );
  };

  const connectWebSocket = (resumeIds) => {
    if (wsRef.current) wsRef.current.close();

   const ws = new WebSocket(
     `ws://localhost:8000/ws/resumes?token=${accessToken}`,
   );
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const { resume_id, status } = data;

      if (!resumeIds.includes(resume_id)) return;

      if (status === 'completed') {
        updateFileStatus(resume_id, 'completed', {
          fileUrl: data.file_url,
        });
      } else if (status === 'failed') {
        updateFileStatus(resume_id, 'failed', {
          error: data.error || 'Processing failed',
        });
      } else {
        updateFileStatus(resume_id, status);
      }
    };

    ws.onerror = () => {
      resumeIds.forEach((id) =>
        updateFileStatus(id, 'failed', {
          error: 'WebSocket error',
        }),
      );
    };

    wsRef.current = ws;
  };

  const upload = async () => {
    const validFiles = files.filter((f) => f.status === 'pending');
    if (!validFiles.length) return;

    setUploading(true);

    const allResumeIds = [];

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status !== 'pending') continue;

      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'queued' } : f)),
      );

      const formData = new FormData();
      formData.append('files', item.file);

      try {
        const res = await uploadResumes(formData);
        const created = res.data[0];

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, resumeId: created.id, status: 'queued' } : f,
          ),
        );

        allResumeIds.push(created.id);
      } catch (err) {
        const detail = err.response?.data?.detail;
        const message =
          typeof detail === 'object'
            ? detail.message
            : detail || 'Upload failed';

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: message } : f,
          ),
        );
      }
    }

    if (allResumeIds.length > 0) {
      connectWebSocket(allResumeIds);
    }

    setUploading(false);
  };

  const reset = () => {
    if (wsRef.current) wsRef.current.close();
    setFiles([]);
    setUploading(false);
  };

  return { files, uploading, addFiles, removeFile, upload, reset };
}
