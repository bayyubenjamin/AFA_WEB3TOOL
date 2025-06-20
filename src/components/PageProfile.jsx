import React, { useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LanguageContext } from '../context/LanguageContext';
import { ThemeContext } from '../context/ThemeContext';
import { FiLogOut, FiSettings, FiUser, FiLink, FiMoon, FiSun, FiGlobe } from 'react-icons/fi';

const PageProfile = () => {
  const [user, setUser] = useState(null);
  const { language, changeLanguage } = useContext(LanguageContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleLinkEmailPassword = () => {
    // Implement your logic here
  };

  const handleLinkTelegram = () => {
    // Implement your logic here
  };
  
  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} transition-colors duration-500`}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto">
          {/* Profile Card */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 mb-8 transition-all duration-500 hover:shadow-2xl`}>
            <div className="flex flex-col items-center">
              <img
                src={user?.user_metadata?.avatar_url || 'http://googleusercontent.com/image_generation_content/0'}
                alt="Profile Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg mb-4"
              />
              <h1 className="text-3xl font-bold">{user?.user_metadata?.full_name || 'Username'}</h1>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-lg`}>{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          {/* Settings & Actions */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 transition-all duration-500`}>
             <h2 className="text-xl font-semibold mb-4 flex items-center"><FiSettings className="mr-2" /> Pengaturan</h2>
            <div className="space-y-4">
               {/* Language Selector */}
              <div className="flex items-center justify-between">
                <label htmlFor="language-select" className="flex items-center">
                  <FiGlobe className="mr-3" /> Bahasa
                </label>
                <select id="language-select" value={language} onChange={handleLanguageChange} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-md p-2`}>
                  <option value="en">English</option>
                  <option value="id">Indonesia</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  {theme === 'dark' ? <FiMoon className="mr-3" /> : <FiSun className="mr-3" />}
                  Mode Gelap
                </span>
                <button onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-yellow-400'}`}>
                   {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                </button>
              </div>
              
              <hr className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

              <h2 className="text-xl font-semibold mb-2 pt-2 flex items-center"><FiLink className="mr-2" /> Akun Tertaut</h2>
               {/* Link Buttons */}
              <button onClick={handleLinkEmailPassword} className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-all duration-300">
                <FiUser className="mr-2" /> Link Email/Password
              </button>
              <button onClick={handleLinkTelegram} className="w-full flex items-center justify-center py-3 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.78 18.65l.28-4.23.02-2.14c0-.6.18-1.02.53-1.28.35-.27.8-.4 1.3-.4.73 0 1.28.16 1.7.5.4.34.68.85.68 1.5 0 .2-.02.43-.05.68l-.2 1.35-2.2 9.4c-.2 1.02-.6 1.53-1.2 1.53-.5 0-.9-.2-1.2-.6-.3-.4-.4-.9-.4-1.4 0-.5.14-.98.42-1.4l2.2-3.15zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                Link Telegram
              </button>
              
              <hr className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

              {/* Logout Button */}
              <button onClick={handleLogout} className="w-full flex items-center justify-center py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-all duration-300">
                <FiLogOut className="mr-2" /> Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageProfile;
