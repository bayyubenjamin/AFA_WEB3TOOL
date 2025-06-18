// src/components/PageAdminEvents.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faTimes, faTasks, faLink, faShieldHalved, faImage, faTrophy, faCalendarAlt, faInfoCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faXTwitter, faTelegram, faYoutube, faDiscord } from '@fortawesome/free-brands-svg-icons';

// Komponen Form untuk membuat/mengedit event
const EventForm = ({ onSave, onCancel, initialData, loading, currentUser }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_image_url || '');
  const [reward, setReward] = useState(initialData?.reward_pool || '');
  const [endDate, setEndDate] = useState(initialData?.end_date ? new Date(initialData.end_date).toISOString().substring(0, 16) : '');
  const [tasks, setTasks] = useState(initialData?.tasks || [{ task_type: 'twitter', title: 'Follow AFA on X', link_url: 'https://x.com/bayybayss' }]);

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    // Otomatis isi judul berdasarkan tipe task
    if (field === 'task_type') {
      const defaultTitles = {
        twitter: 'Follow on X',
        telegram: 'Join Telegram',
        youtube: 'Subscribe on YouTube',
        discord: 'Join Discord Server',
      };
      newTasks[index].title = defaultTitles[value] || 'Custom Task';
    }
    setTasks(newTasks);
  };

  const addTask = () => setTasks([...tasks, { task_type: 'twitter', title: 'Follow on X', link_url: '' }]);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !reward) {
      alert("Judul dan Deskripsi Hadiah wajib diisi.");
      return;
    }
    const eventData = {
      title,
      description,
      banner_image_url: bannerUrl,
      reward_pool: reward,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      created_by: currentUser.id,
      is_active: true, // Selalu aktif saat dibuat/diedit
    };
    onSave(eventData, tasks);
  };

  const taskIcons = {
    twitter: faXTwitter,
    telegram: faTelegram,
    youtube: faYoutube,
    discord: faDiscord,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6 bg-light-card dark:bg-card border border-black/10 dark:border-white/10 rounded-2xl">
      <h2 className="text-2xl font-bold text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-4">
        {initialData ? 'Edit Event Giveaway' : 'Buat Event Giveaway Baru'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label" htmlFor="title">Judul Event</label>
          <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Cth: AFA Community Launch Giveaway" required />
        </div>
        <div>
          <label className="form-label" htmlFor="reward">Deskripsi Hadiah</label>
          <input id="reward" type="text" value={reward} onChange={e => setReward(e.target.value)} className="form-input" placeholder="Cth: 100 USDT untuk 5 Pemenang" required />
        </div>
      </div>
      <div>
        <label className="form-label" htmlFor="bannerUrl">URL Gambar Banner</label>
        <input id="bannerUrl" type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="form-input" placeholder="https://domain.com/banner.jpg" />
      </div>
      <div>
        <label className="form-label" htmlFor="description">Deskripsi Singkat</label>
        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="form-input" rows="3" placeholder="Jelaskan tentang event ini..."></textarea>
      </div>
      <div>
        <label className="form-label" htmlFor="endDate">Tanggal Berakhir (Opsional)</label>
        <input id="endDate" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-light-text dark:text-white mb-2">Tugas (Tasks)</h3>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-black/5 dark:bg-white/5">
              <FontAwesomeIcon icon={taskIcons[task.task_type] || faTasks} className="text-primary text-xl" />
              <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                <select value={task.task_type} onChange={e => handleTaskChange(index, 'task_type', e.target.value)} className="form-input text-xs">
                  <option value="twitter">X (Twitter)</option>
                  <option value="telegram">Telegram</option>
                  <option value="youtube">YouTube</option>
                  <option value="discord">Discord</option>
                </select>
                <input type="text" value={task.title} onChange={e => handleTaskChange(index, 'title', e.target.value)} placeholder="Deskripsi Tugas" className="form-input text-xs" />
                <input type="url" value={task.link_url} onChange={e => handleTaskChange(index, 'link_url', e.target.value)} placeholder="https://..." className="form-input text-xs" required />
              </div>
              <button type="button" onClick={() => removeTask(index)} className="btn-danger p-0 w-8 h-8 flex-shrink-0 text-sm"><FontAwesomeIcon icon={faTimes} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTask} className="btn-secondary text-xs mt-4 px-4 py-2"><FontAwesomeIcon icon={faPlus} className="mr-2" /> Tambah Tugas</button>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary px-6 py-2.5 rounded-lg text-sm">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 rounded-lg text-sm flex items-center">
          {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faTrophy} className="mr-2" />}
          Simpan Event
        </button>
      </div>
    </form>
  );
};

// Komponen utama halaman admin
export default function PageAdminEvents({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingEvent, setEditingEvent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, event_tasks(*), event_participants(count)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  const handleSave = async (eventData, tasks) => {
    setFormLoading(true);
    try {
      if (editingEvent) { // --- EDIT LOGIC ---
        const { error: eventError } = await supabase.from('events').update(eventData).eq('id', editingEvent.id);
        if (eventError) throw eventError;
        // Hapus task lama, lalu insert yang baru (cara simpel)
        await supabase.from('event_tasks').delete().eq('event_id', editingEvent.id);
        const tasksToInsert = tasks.map(task => ({ ...task, event_id: editingEvent.id }));
        const { error: tasksError } = await supabase.from('event_tasks').insert(tasksToInsert);
        if (tasksError) throw tasksError;

      } else { // --- CREATE LOGIC ---
        const { data: newEvent, error: eventError } = await supabase.from('events').insert(eventData).select().single();
        if (eventError) throw eventError;
        const tasksToInsert = tasks.map(task => ({ ...task, event_id: newEvent.id }));
        const { error: tasksError } = await supabase.from('event_tasks').insert(tasksToInsert);
        if (tasksError) throw tasksError;
      }
      setView('list');
      setEditingEvent(null);
      fetchEvents(); // Re-fetch data
    } catch (error) {
      alert("Error saving event: " + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Yakin ingin menghapus event ini? Semua data partisipan akan hilang.")) {
      try {
        await supabase.from('events').delete().eq('id', eventId);
        fetchEvents();
      } catch (error) {
        alert("Error deleting event: " + error.message);
      }
    }
  };
  
  if (view === 'form') {
    return <EventForm onSave={handleSave} onCancel={() => setView('list')} initialData={editingEvent} loading={formLoading} currentUser={currentUser}/>;
  }

  return (
    <section className="page-content space-y-8 pt-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3 flex items-center justify-center gap-3">
           <FontAwesomeIcon icon={faShieldHalved}/> Admin Panel: Events
        </h1>
        <p className="text-lg text-light-subtle dark:text-gray-400">Kelola semua event dan giveaway di sini.</p>
      </div>
      <div className="text-center">
        <button onClick={() => { setEditingEvent(null); setView('form'); }} className="btn-primary px-6 py-3 text-base">
          <FontAwesomeIcon icon={faPlus} className="mr-2"/> Buat Event Baru
        </button>
      </div>

      {loading && <div className="text-center"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/></div>}
      {error && <div className="text-center text-red-400">{error}</div>}

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="card rounded-lg p-4 flex flex-col md:flex-row items-start gap-4">
            <img src={event.banner_image_url || 'https://placehold.co/600x400/101020/7f5af0?text=Event'} alt={event.title} className="w-full md:w-48 h-32 md:h-auto object-cover rounded-md" />
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-light-text dark:text-white">{event.title}</h3>
              <p className="text-sm text-green-400 font-semibold mb-2">{event.reward_pool}</p>
              <div className="flex flex-wrap gap-4 text-xs text-light-subtle dark:text-gray-400 mt-2">
                <span title="Partisipan"><FontAwesomeIcon icon={faUsers} className="mr-1.5"/>{event.event_participants[0]?.count || 0} partisipan</span>
                <span title="Jumlah Tugas"><FontAwesomeIcon icon={faTasks} className="mr-1.5"/>{event.event_tasks.length} tugas</span>
                {event.end_date && <span title="Batas Akhir"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5"/> {new Date(event.end_date).toLocaleString()}</span>}
              </div>
            </div>
            <div className="flex gap-2 self-start">
              <button onClick={() => { setEditingEvent(event); setView('form'); }} className="btn-secondary p-0 w-9 h-9 text-sm"><FontAwesomeIcon icon={faEdit}/></button>
              <button onClick={() => handleDelete(event.id)} className="btn-danger p-0 w-9 h-9 text-sm"><FontAwesomeIcon icon={faTrash}/></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
