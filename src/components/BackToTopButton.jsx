// src/components/BackToTopButton.jsx

import React from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTopButton = ({ onClick, show }) => {
  return (
    <button
      onClick={onClick}
      className={`back-to-top-btn ${show ? 'active' : ''}`}
      aria-label="Kembali ke atas"
    >
      <ArrowUp size={24} />
    </button>
  );
};

export default BackToTopButton;
