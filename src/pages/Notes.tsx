import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface Note {
  id: string;
  title: string;
  content?: string;
  created_at: string;
}

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setNotes(data as Note[]);
      }
      setLoading(false);
    };
    loadNotes();
  }, []);

  if (loading) return <p className="p-6">Loading notes…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>
      {notes.length === 0 ? (
        <p>No notes found.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map(note => (
            <li key={note.id} className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
              <h2 className="text-lg font-semibold mb-1">{note.title}</h2>
              {note.content && <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>}
              {note.created_at && !isNaN(Date.parse(note.created_at)) && (
                <p className="text-xs text-gray-500 mt-2">{new Date(note.created_at).toLocaleString()}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notes; 