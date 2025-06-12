// src/components/PageManageUpdate.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AirdropUpdateForm from './AirdropUpdateForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

export default function PageManageUpdate({ currentUser }) {
  const { airdropSlug, updateId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!updateId;

  const [airdrop, setAirdrop] = useState(null);
  const [initialUpdateData, setInitialUpdateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  useEffect(() => {
    if (currentUser === undefined) return; 

    if (currentUser && !isAdmin) {
      navigate(`/airdrops/${airdropSlug}`);
    }
  }, [currentUser, isAdmin, navigate, airdropSlug]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: airdropData, error: airdropError } = await supabase
        .from('airdrops').select('id, title').eq('slug', airdropSlug).single();
      if (airdropError) throw new Error(`Airdrop dengan slug "${airdropSlug}" tidak ditemukan.`);
      setAirdrop(airdropData);

      if (isEditing) {
        const { data: updateData, error: updateError } = await supabase
          .from('AirdropUpdates').select('*').eq('id', updateId).single();
        if (updateError) throw new Error(`Update dengan ID "${updateId}" tidak ditemukan.`);
        setInitialUpdateData(updateData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [airdropSlug, updateId, isEditing]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [fetchData, isAdmin]);
  
  const handleSaveComplete = () => {
    alert(isEditing ? 'Update berhasil disimpan!' : 'Update baru berhasil ditambahkan!');
    navigate(`/airdrops/${airdropSlug}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full pt-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/></div>;
  }
  
  if (error) {
    return <div className="text-center text-red-400 pt-20"><p>{error}</p></div>;
  }
  
  if (!isAdmin) return null;

  return (
    // [EDIT] Ubah warna teks utama halaman
    <div className="page-content py-6 md:py-8 max-w-4xl mx-auto text-light-text dark:text-white">
      <Link to={`/airdrops/${airdropSlug}`} className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Detail Airdrop
      </Link>
      <AirdropUpdateForm
        key={updateId || 'add'}
        airdropId={airdrop.id}
        initialData={initialUpdateData}
        onUpdateAdded={handleSaveComplete}
        onCancelEdit={() => navigate(`/airdrops/${airdropSlug}`)}
        currentUser={currentUser}
      />
    </div>
  );
}
