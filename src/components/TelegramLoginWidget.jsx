// src/components/TelegramLoginWidget.jsx
import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// [PENTING] Ganti dengan username bot Telegram Anda (tanpa '@')
const TELEGRAM_BOT_USERNAME = "afaweb3tool_bot";

const TelegramLoginWidget = ({ onTelegramAuth, loading }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      // Definisikan callback function di window object
      window.onTelegramAuth = (user) => {
        onTelegramAuth(user);
      };

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '10');
      // Panggil fungsi global yang sudah kita definisikan
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');

      ref.current.appendChild(script);

      return () => {
        // Cleanup script dan callback
        if (ref.current && ref.current.contains(script)) {
          ref.current.removeChild(script);
        }
        delete window.onTelegramAuth;
      };
    }
  }, [onTelegramAuth]);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-2">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          <span>Memverifikasi...</span>
        </div>
      ) : (
        <div ref={ref}></div>
      )}
    </>
  );
};

export default TelegramLoginWidget;
