// src/components/PageAdminEvents.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSpinner, faTimes, faTasks, faLink, faShieldHalved, faImage, faTrophy, faCalendarAlt, faInfoCircle, faUsers, faArrowLeft, faSignature, faCircleInfo, faSackDollar, faBullhorn } from '@fortawesome/free-solid-svg-icons';
import { faXTwitter, faTelegram, faYoutube, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate } from 'react-router-dom';

// --- STYLING CONSTANTS ---
const inputBaseClass = "w-full bg-black/5 dark:bg-dark border border-black/10 dark:border-white/10 text-light-text dark:text-gray-200 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all";
const labelBaseClass = "block text-sm font-semibold text-light-subtle dark:text-gray-300 mb-2 flex items-center";

// --- FORM COMPONENT ---
const EventForm = ({ onSave, onCancel, initialData, loading, currentUser }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    banner_image_url: initialData?.banner_image_url || '',
    reward_pool: initialData?.reward_pool || '',
    end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().substring(0, 16) : '',
  });
  
  const [tasks, setTasks] = useState(initialData?.tasks || [{ task_type: 'twitter', title: 'Follow AFA on X', link_url: 'https://x.com/bayybayss' }]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    if (field === 'task_type') {
      const defaultTitles = {
        twitter: 'Follow on X', telegram: 'Join Telegram',
        youtube: 'Subscribe on YouTube', discord: 'Join Discord Server',
      };
      newTasks[index].title = defaultTitles[value] || 'Custom Task';
    }
    setTasks(newTasks);
  };

  const addTask = () => setTasks([...tasks, { task_type: 'twitter', title: 'Follow on X', link_url: '' }]);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.reward_pool) {
      alert("Judul dan Deskripsi Hadiah wajib diisi.");
      return;
    }
    const eventData = {
      ...formData,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      created_by: currentUser.id,
      is_active: true,
    };
    onSave(eventData, tasks);
  };
  
  const taskIcons = { twitter: faXTwitter, telegram: faTelegram, youtube: faYoutube, discord: faDiscord };

  return (
    <div>
      <button onClick={onCancel} className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Panel Admin Events
      </button>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-2">
                {initialData ? 'Edit Event' : 'Create New Event'}
            </h1>
            <p className="text-lg text-light-subtle dark:text-gray-400">Isi detail giveaway dengan lengkap dan menarik.</p>
        </div>

        {/* --- MAIN LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card Informasi Utama */}
            <div className="card-premium">
              <h3 className="card-header"><FontAwesomeIcon icon={faBullhorn} className="mr-3 text-primary"/>Informasi Utama</h3>
              <div className="card-content space-y-4">
                <div>
                  <label htmlFor="title" className={labelBaseClass}><FontAwesomeIcon icon={faSignature} className="mr-2 w-4"/>Judul Event</label>
                  <input id="title" name="title" type="text" value={formData.title} onChange={handleFormChange} className={inputBaseClass} placeholder="Cth: AFA Community Launch Giveaway" required />
                </div>
                <div>
                  <label htmlFor="description" className={labelBaseClass}><FontAwesomeIcon icon={faCircleInfo} className="mr-2 w-4"/>Deskripsi Singkat</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} className={`${inputBaseClass} min-h-[100px]`} placeholder="Jelaskan tentang event ini, tujuannya, dan mengapa pengguna harus berpartisipasi..."></textarea>
                </div>
              </div>
            </div>

            {/* Card Tugas */}
            <div className="card-premium">
              <h3 className="card-header"><FontAwesomeIcon icon={faTasks} className="mr-3 text-primary"/>Tugas Partisipasi</h3>
              <div className="card-content space-y-3">
                {tasks.map((task, index) => (
                  <div key={index} className="flex items-stretch gap-2 p-3 rounded-lg bg-black/5 dark:bg-dark border border-black/10 dark:border-white/10">
                    <div className="flex-shrink-0 w-10 flex items-center justify-center bg-primary/10 rounded-md">
                      <FontAwesomeIcon icon={taskIcons[task.task_type] || faTasks} className="text-primary text-xl" />
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select value={task.task_type} onChange={e => handleTaskChange(index, 'task_type', e.target.value)} className={inputBaseClass}>
                          <option value="twitter">X (Twitter)</option> <option value="telegram">Telegram</option>
                          <option value="youtube">YouTube</option> <option value="discord">Discord</option>
                        </select>
                        <input type="text" value={task.title} onChange={e => handleTaskChange(index, 'title', e.target.value)} placeholder="Deskripsi Tugas" className={inputBaseClass} />
                        <input type="url" value={task.link_url} onChange={e => handleTaskChange(index, 'link_url', e.target.value)} placeholder="https://..." className={inputBaseClass} required />
                    </div>
                    <button type="button" onClick={() => removeTask(index)} className="btn-danger p-0 w-10 h-10 flex-shrink-0"><FontAwesomeIcon icon={faTimes} /></button>
                  </div>
                ))}
                <button type="button" onClick={addTask} className="btn-secondary w-full mt-4 py-2 text-sm"><FontAwesomeIcon icon={faPlus} className="mr-2" /> Tambah Tugas Baru</button>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-1 space-y-8">
            <div className="card-premium">
              <h3 className="card-header"><FontAwesomeIcon icon={faInfoCircle} className="mr-3 text-primary"/>Detail Tambahan</h3>
              <div className="card-content space-y-4">
                 <div>
                    <label htmlFor="reward_pool" className={labelBaseClass}><FontAwesomeIcon icon={faSackDollar} className="mr-2 w-4"/>Deskripsi Hadiah</label>
                    <input id="reward_pool" name="reward_pool" type="text" value={formData.reward_pool} onChange={handleFormChange} className={inputBaseClass} placeholder="Cth: 100 USDT untuk 5 Pemenang" required />
                 </div>
                 <div>
                    <label htmlFor="banner_image_url" className={labelBaseClass}><FontAwesomeIcon icon={faImage} className="mr-2 w-4"/>URL Gambar Banner</label>
                    <input id="banner_image_url" name="banner_image_url" type="url" value={formData.banner_image_url} onChange={handleFormChange} className={inputBaseClass} placeholder="https://domain.com/banner.jpg" />
                 </div>
                 <div>
                    <label htmlFor="end_date" className={labelBaseClass}><FontAwesomeIcon icon={faCalendarAlt} className="mr-2 w-4"/>Tanggal Berakhir (Opsional)</label>
                    <input id="end_date" name="end_date" type="datetime-local" value={formData.end_date} onChange={handleFormChange} className={inputBaseClass} />
                 </div>
              </div>
            </div>
             <div className="flex flex-col gap-3 sticky top-24">
                <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrophy} className="mr-2" />}
                  {initialData ? 'Simpan Perubahan' : 'Publikasikan Event'}
                </button>
                <button type="button" onClick={onCancel} className="btn-secondary w-full text-base py-3">Batal</button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

// Komponen utama halaman admin
export default function PageAdminEvents({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  const [editingEvent, setEditingEvent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

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
    if (view === 'list') {
        fetchEvents();
    }
  }, [fetchEvents, view]);
  
  const handleSave = async (eventData, tasks) => {
    setFormLoading(true);
    let eventId;
    try {
      if (editingEvent) {
        const { id, ...updateData } = eventData; // Hapus id dari data update
        const { error: eventError } = await supabase.from('events').update(updateData).eq('id', editingEvent.id);
        if (eventError) throw eventError;
        eventId = editingEvent.id;
      } else {
        const { data: newEvent, error: eventError } = await supabase.from('events').insert(eventData).select().single();
        if (eventError) throw eventError;
        eventId = newEvent.id;
      }

      await supabase.from('event_tasks').delete().eq('event_id', eventId);
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map(task => ({ ...task, event_id: eventId }));
        const { error: tasksError } = await supabase.from('event_tasks').insert(tasksToInsert);
        if (tasksError) throw tasksError;
      }
      
      setView('list');
      setEditingEvent(null);
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
      <button onClick={() => navigate('/admin')} className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali ke Admin Dashboard
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">Event Management</h1>
          <p className="text-lg text-light-subtle dark:text-gray-400">Kelola semua event dan giveaway di sini.</p>
        </div>
        <button onClick={() => { setEditingEvent(null); setView('form'); }} className="btn-primary px-5 py-2.5 text-sm">
          <FontAwesomeIcon icon={faPlus} className="mr-2"/> Buat Event Baru
        </button>
      </div>

      {loading && <div className="text-center py-10"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/></div>}
      {error && <div className="text-center text-red-400 py-10">{error}</div>}

      <div className="space-y-4">
        {events.length === 0 && !loading && (
          <div className="text-center py-16 card-premium">
            <h3 className="text-xl font-semibold">Belum Ada Event</h3>
            <p className="text-light-subtle dark:text-gray-400 mt-2">Klik "Buat Event Baru" untuk memulai giveaway pertama Anda.</p>
          </div>
        )}
        {events.map(event => (
          <div key={event.id} className="card-premium flex flex-col md:flex-row items-start gap-5">
            <img src={event.banner_image_url || 'https://placehold.co/600x400/101020/7f5af0?text=Event'} alt={event.title} className="w-full md:w-48 h-32 md:h-auto object-cover rounded-lg" />
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-light-text dark:text-white">{event.title}</h3>
              <p className="text-sm text-green-400 font-semibold mb-2">{event.reward_pool}</p>
              <div className="flex flex-wrap gap-4 text-xs text-light-subtle dark:text-gray-400 mt-2">
                <span title="Partisipan"><FontAwesomeIcon icon={faUsers} className="mr-1.5"/>{event.event_participants[0]?.count || 0} partisipan</span>
                <span title="Jumlah Tugas"><FontAwesomeIcon icon={faTasks} className="mr-1.5"/>{event.event_tasks.length} tugas</span>
                {event.end_date && <span title="Batas Akhir"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5"/> {new Date(event.end_date).toLocaleString('id-ID')}</span>}
              </div>
            </div>
            <div className="flex gap-2 self-start mt-2 md:mt-0">
              <button onClick={() => { setEditingEvent(event); setView('form'); }} className="btn-secondary p-0 w-9 h-9 text-sm"><FontAwesomeIcon icon={faEdit}/></button>
              <button onClick={() => handleDelete(event.id)} className="btn-danger p-0 w-9 h-9 text-sm"><FontAwesomeIcon icon={faTrash}/></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

