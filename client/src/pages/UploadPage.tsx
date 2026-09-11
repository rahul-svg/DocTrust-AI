import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import Navbar from '../components/Navbar';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_MB = 10;

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const validate = (f: File): string => {
    if (!ALLOWED_TYPES.includes(f.type)) return 'Only PDF, JPG, and PNG files are supported.';
    if (f.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB} MB.`;
    return '';
  };

  const handleSelect = (f: File) => {
    const err = validate(f);
    if (err) { setError(err); setFile(null); return; }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleSelect(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await documentService.upload(file);
      navigate('/documents');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto p-8">
        <button
          onClick={() => navigate('/documents')}
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to Documents
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Document</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleSelect(e.target.files[0])}
            />
            {file ? (
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">Drag & drop a file here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG — max 10 MB</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload & Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
