import { useState } from 'react';
import { Globe, Clock, Calendar, Check, X, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface SettingsProps {
  users: UserProfile[];
  activeUserId: string;
  onSelectActiveUser: (id: string) => void;
  onAddUser: (user: Omit<UserProfile, 'id'>) => void;
  onEditUser: (id: string, updated: Partial<UserProfile>) => void;
  onDeleteUser: (id: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  timeFormat: '12h' | '24h';
  onTimeFormatChange: (format: '12h' | '24h') => void;
  dateFormat: string;
  onDateFormatChange: (format: string) => void;
  theme: 'light' | 'dark' | 'system' | 'sepia' | 'midnight';
  onThemeChange: (theme: 'light' | 'dark' | 'system' | 'sepia' | 'midnight') => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  lineHeight: number;
  onLineHeightChange: (lh: number) => void;
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  lineNumbersVisible: boolean;
  onToggleLineNumbers: () => void;
  onClose: () => void;
}

const fontOptions = [
  { value: 'System Default', label: 'System Default' },
  { value: 'Monospace', label: 'Monospace (JetBrains Mono)' },
  { value: 'Serif', label: 'Serif (Georgia)' },
  { value: 'Sans-serif', label: 'Sans-serif (Inter)' }
];

const languages = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' }
];

const timezones = [
  { value: 'GMT-12:00', label: 'GMT-12:00 - International Date Line West' },
  { value: 'GMT-11:00', label: 'GMT-11:00 - Midway Island, Samoa' },
  { value: 'GMT-10:00', label: 'GMT-10:00 - Hawaii Standard Time' },
  { value: 'GMT-09:00', label: 'GMT-09:00 - Alaska Standard Time' },
  { value: 'GMT-08:00', label: 'GMT-08:00 - Pacific Standard Time (PST)' },
  { value: 'GMT-07:00', label: 'GMT-07:00 - Mountain Standard Time (MST)' },
  { value: 'GMT-06:00', label: 'GMT-06:00 - Central Standard Time (CST)' },
  { value: 'GMT-05:00', label: 'GMT-05:00 - Eastern Standard Time (EST)' },
  { value: 'GMT-04:00', label: 'GMT-04:00 - Atlantic Standard Time (AST)' },
  { value: 'GMT-03:00', label: 'GMT-03:00 - Argentina Standard Time (ART)' },
  { value: 'GMT-02:00', label: 'GMT-02:00 - Mid-Atlantic Time' },
  { value: 'GMT-01:00', label: 'GMT-01:00 - Azores Time' },
  { value: 'GMT+00:00', label: 'GMT+00:00 - Greenwich Mean Time (GMT)' },
  { value: 'GMT+01:00', label: 'GMT+01:00 - Central European Time (CET)' },
  { value: 'GMT+02:00', label: 'GMT+02:00 - Eastern European Time (EET / Bucharest)' },
  { value: 'GMT+03:00', label: 'GMT+03:00 - Moscow Standard Time (MSK)' },
  { value: 'GMT+04:00', label: 'GMT+04:00 - Gulf Standard Time (GST)' },
  { value: 'GMT+05:00', label: 'GMT+05:00 - Pakistan Standard Time (PKT)' },
  { value: 'GMT+05:30', label: 'GMT+05:30 - Indian Standard Time (IST)' },
  { value: 'GMT+06:00', label: 'GMT+06:00 - Bangladesh Standard Time (BST)' },
  { value: 'GMT+07:00', label: 'GMT+07:00 - Indochina Time (ICT)' },
  { value: 'GMT+08:00', label: 'GMT+08:00 - China Standard Time (CST)' },
  { value: 'GMT+09:00', label: 'GMT+09:00 - Japan Standard Time (JST)' },
  { value: 'GMT+10:00', label: 'GMT+10:00 - Australian Eastern Standard Time (AEST)' },
  { value: 'GMT+11:00', label: 'GMT+11:00 - Solomon Islands Time (SBT)' },
  { value: 'GMT+12:00', label: 'GMT+12:00 - New Zealand Standard Time (NZST)' }
];

const dateFormats = [
  { value: 'DD/MM/YY', label: 'DD/MM/YY (e.g. 22/06/26)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 22/06/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 06/22/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-06-22)' }
];

export default function Settings({
  users,
  activeUserId,
  onSelectActiveUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
  language,
  onLanguageChange,
  timezone,
  onTimezoneChange,
  timeFormat,
  onTimeFormatChange,
  dateFormat,
  onDateFormatChange,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  lineHeight,
  onLineHeightChange,
  fontFamily,
  onFontFamilyChange,
  lineNumbersVisible,
  onToggleLineNumbers,
  onClose
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'general'>('general');

  // Local CRUD Form States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInitials, setFormInitials] = useState('');
  const [formError, setFormError] = useState('');


  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormInitials(user.initials);
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormInitials('');
    setFormError('');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formInitials.trim()) {
      setFormError('All fields are required.');
      return;
    }

    if (editingUserId) {
      onEditUser(editingUserId, {
        name: formName.trim(),
        email: formEmail.trim(),
        initials: formInitials.trim().toUpperCase()
      });
      setEditingUserId(null);
    } else {
      onAddUser({
        name: formName.trim(),
        email: formEmail.trim(),
        initials: formInitials.trim().toUpperCase()
      });
    }

    setFormName('');
    setFormEmail('');
    setFormInitials('');
    setFormError('');
  };

  const handleStartAdd = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormInitials('');
    setFormError('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-light-bg dark:bg-[#1E1E1E] transition-colors duration-200 overflow-y-auto">
      
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-200 dark:border-[#3F3F3F] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-white font-sans">Settings Page</h1>
          <p className="text-xs text-gray-400 dark:text-neutral-400 mt-1 font-sans">Manage preferences and author profiles</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-[#3F3F3F] hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-gray-200 dark:border-[#3F3F3F] flex gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 text-xs font-semibold border-b-2 transition font-sans ${
            activeTab === 'profile'
              ? 'border-brand-azure text-brand-azure'
              : 'border-transparent text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`py-3.5 text-xs font-semibold border-b-2 transition font-sans ${
            activeTab === 'general'
              ? 'border-brand-azure text-brand-azure'
              : 'border-transparent text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          General Settings
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl px-8 py-8 space-y-8 fade-in">
        
        {activeTab === 'profile' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase font-sans">User Profile Management</h2>
              <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Switch profiles, add, edit, or delete notepad authors.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: User cards list */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-sans">{users.length} Profiles Found</span>
                  {editingUserId !== null && (
                    <button
                      onClick={handleStartAdd}
                      className="text-[11px] font-bold text-brand-azure flex items-center gap-1 hover:underline font-sans"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create New</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {users.map(u => {
                    const isActive = u.id === activeUserId;
                    return (
                      <div
                        key={u.id}
                        onClick={() => onSelectActiveUser(u.id)}
                        className={`flex items-center justify-between p-4 bg-white dark:bg-[#2D2D2D] border rounded-2xl cursor-pointer transition hover:shadow-md ${
                          isActive
                            ? 'border-brand-azure ring-1 ring-brand-azure'
                            : 'border-gray-200 dark:border-[#3F3F3F]'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange text-sm font-bold flex-shrink-0 shadow-sm font-sans">
                            {u.initials}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate font-sans">{u.name}</h4>
                              {isActive && (
                                <span className="px-1.5 py-0.5 bg-brand-azure/10 text-brand-azure text-[9px] font-bold rounded-md font-sans">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-400 truncate font-sans">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteUser(u.id)}
                            disabled={isActive || users.length <= 1}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition"
                            title={isActive ? "Cannot delete active profile" : "Delete Profile"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Add/Edit Form */}
              <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-[#3F3F3F]">
                  <UserPlus className="w-4 h-4 text-brand-azure" />
                  <h3 className="text-xs font-bold text-neutral-800 dark:text-white font-sans">
                    {editingUserId ? 'Edit Profile' : 'Add New Profile'}
                  </h3>
                </div>

                <form onSubmit={handleSaveUser} className="space-y-3.5">
                  {formError && (
                    <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-[10px] text-red-600 font-semibold font-sans">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Arthur Taylor"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-light-bg dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. arthur@notepad.com"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-light-bg dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">Initials Badge</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="e.g. AT"
                      value={formInitials}
                      onChange={e => setFormInitials(e.target.value)}
                      className="w-full px-3 py-2 bg-light-bg dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans font-semibold uppercase"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-brand-azure hover:bg-brand-azure/90 text-white text-[11px] font-semibold rounded-xl transition font-sans"
                    >
                      {editingUserId ? 'Save Profile' : 'Add Profile'}
                    </button>
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-2 border border-gray-200 dark:border-[#3F3F3F] hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-[11px] font-semibold rounded-xl transition font-sans"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* General Settings: Regional Preferences */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase font-sans">Regional Preferences</h2>
                <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Select preferences for your region.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Language Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Globe className="w-3.5 h-3.5 text-brand-azure" />
                    <span>Language</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} &nbsp; {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timezone Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Clock className="w-3.5 h-3.5 text-brand-azure" />
                    <span>Timezone</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => onTimezoneChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Format */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Clock className="w-3.5 h-3.5 text-brand-azure" />
                    <span>Time Format</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer font-sans">
                      <input
                        type="radio"
                        name="timeFormat"
                        checked={timeFormat === '12h'}
                        onChange={() => onTimeFormatChange('12h')}
                        className="w-4 h-4 text-brand-azure border-gray-300 focus:ring-brand-azure dark:border-[#3F3F3F]"
                      />
                      <span>12-hour</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer font-sans">
                      <input
                        type="radio"
                        name="timeFormat"
                        checked={timeFormat === '24h'}
                        onChange={() => onTimeFormatChange('24h')}
                        className="w-4 h-4 text-brand-azure border-gray-300 focus:ring-brand-azure dark:border-[#3F3F3F]"
                      />
                      <span>24-hour</span>
                    </label>
                  </div>
                </div>

                {/* Date Format */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-brand-azure" />
                    <span>Date Format</span>
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => onDateFormatChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans"
                  >
                    {dateFormats.map((df) => (
                      <option key={df.value} value={df.value}>
                        {df.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* General Settings: Theme Options Picker */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase font-sans">Theme Options</h2>
                <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Pick theme to personalize experience.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                
                {/* Light Theme Option Card */}
                <div 
                  onClick={() => onThemeChange('light')}
                  className={`cursor-pointer group flex flex-col bg-white dark:bg-[#2D2D2D] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    theme === 'light' 
                      ? 'border-brand-azure ring-1 ring-brand-azure' 
                      : 'border-gray-200 dark:border-[#3F3F3F]'
                  }`}
                >
                  <div className="h-28 bg-[#F3F4F6] p-3 flex gap-2 border-b border-gray-200 dark:border-[#3F3F3F] relative">
                    <div className="w-1/4 bg-white rounded-lg border border-gray-200 shadow-sm" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-white rounded-md border border-gray-200" />
                      <div className="flex-1 bg-white rounded-md border border-gray-200" />
                    </div>
                    {theme === 'light' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-azure text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-white font-sans">Light mode</span>
                  </div>
                </div>

                {/* Dark Theme Option Card */}
                <div 
                  onClick={() => onThemeChange('dark')}
                  className={`cursor-pointer group flex flex-col bg-white dark:bg-[#2D2D2D] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark' 
                      ? 'border-brand-azure ring-1 ring-brand-azure' 
                      : 'border-gray-200 dark:border-[#3F3F3F]'
                  }`}
                >
                  <div className="h-28 bg-[#121212] p-3 flex gap-2 border-b border-gray-200 dark:border-[#3F3F3F] relative">
                    <div className="w-1/4 bg-[#2D2D2D] rounded-lg border border-[#3F3F3F]" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-[#2D2D2D] rounded-md border border-[#3F3F3F]" />
                      <div className="flex-1 bg-[#2D2D2D] rounded-md border border-[#3F3F3F]" />
                    </div>
                    {theme === 'dark' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-azure text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-white font-sans">Dark mode</span>
                  </div>
                </div>

                {/* Sepia Theme Option Card */}
                <div 
                  onClick={() => onThemeChange('sepia')}
                  className={`cursor-pointer group flex flex-col bg-white dark:bg-[#2D2D2D] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    theme === 'sepia' 
                      ? 'border-brand-azure ring-1 ring-brand-azure' 
                      : 'border-gray-200 dark:border-[#3F3F3F]'
                  }`}
                >
                  <div className="h-28 bg-[#F4ECD8] p-3 flex gap-2 border-b border-gray-200 dark:border-[#3F3F3F] relative">
                    <div className="w-1/4 bg-[#EADFCA] rounded-lg border border-[#DFD3BA]" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-[#EADFCA] rounded-md border border-[#DFD3BA]" />
                      <div className="flex-1 bg-[#EADFCA] rounded-md border border-[#DFD3BA]" />
                    </div>
                    {theme === 'sepia' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-azure text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-white font-sans">Sepia mode</span>
                  </div>
                </div>

                {/* Midnight Theme Option Card */}
                <div 
                  onClick={() => onThemeChange('midnight')}
                  className={`cursor-pointer group flex flex-col bg-white dark:bg-[#2D2D2D] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    theme === 'midnight' 
                      ? 'border-brand-azure ring-1 ring-brand-azure' 
                      : 'border-gray-200 dark:border-[#3F3F3F]'
                  }`}
                >
                  <div className="h-28 bg-[#050811] p-3 flex gap-2 border-b border-gray-200 dark:border-[#3F3F3F] relative">
                    <div className="w-1/4 bg-[#0A0F1D] rounded-lg border border-[#1E293B]" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-[#0A0F1D] rounded-md border border-[#1E293B]" />
                      <div className="flex-1 bg-[#0A0F1D] rounded-md border border-[#1E293B]" />
                    </div>
                    {theme === 'midnight' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-azure text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-white font-sans">Midnight</span>
                  </div>
                </div>

                {/* System Theme Option Card */}
                <div 
                  onClick={() => onThemeChange('system')}
                  className={`cursor-pointer group flex flex-col bg-white dark:bg-[#2D2D2D] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    theme === 'system' 
                      ? 'border-brand-azure ring-1 ring-brand-azure' 
                      : 'border-gray-200 dark:border-[#3F3F3F]'
                  }`}
                >
                  <div className="h-28 bg-gradient-to-r from-[#F3F4F6] to-[#121212] p-3 flex gap-2 border-b border-gray-200 dark:border-[#3F3F3F] relative">
                    <div className="w-1/4 bg-[#B9B9B9] dark:bg-[#202020] rounded-lg border border-neutral-400 dark:border-[#3F3F3F]" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-[#B9B9B9] dark:bg-[#202020] rounded-md border border-neutral-400 dark:border-[#3F3F3F]" />
                      <div className="flex-1 bg-[#B9B9B9] dark:bg-[#202020] rounded-md border border-neutral-400 dark:border-[#3F3F3F]" />
                    </div>
                    {theme === 'system' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-azure text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-white font-sans">System</span>
                  </div>
                </div>

              </div>
            </div>

            {/* General Settings: Editor Preferences */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-[#3F3F3F]">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase font-sans">Editor Layout & Typography</h2>
                <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Customize your writing workspace settings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Font Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <span>Editor Font Family</span>
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors font-sans"
                  >
                    {fontOptions.map((fo) => (
                      <option key={fo.value} value={fo.value}>
                        {fo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <span>Font Size (10px - 32px)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                      className="px-3 py-1.5 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:bg-gray-150/40 dark:hover:bg-neutral-800/40 transition font-bold"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-xs font-mono">{fontSize}px</span>
                    <button
                      type="button"
                      onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                      className="px-3 py-1.5 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:bg-gray-150/40 dark:hover:bg-neutral-800/40 transition font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Line Height Slider */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <span>Line Spacing ({lineHeight.toFixed(1)})</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1.2"
                      max="2.5"
                      step="0.1"
                      value={lineHeight}
                      onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 dark:bg-[#3F3F3F] rounded-lg appearance-none cursor-pointer accent-brand-azure"
                    />
                    <span className="text-xs font-mono w-8">{lineHeight.toFixed(1)}</span>
                  </div>
                </div>

                {/* Line Numbers Toggle */}
                <div className="space-y-2 flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer font-sans select-none">
                    <input
                      type="checkbox"
                      checked={lineNumbersVisible}
                      onChange={onToggleLineNumbers}
                      className="w-4 h-4 rounded border-gray-300 dark:border-[#3F3F3F] text-brand-azure focus:ring-brand-azure"
                    />
                    <span>Show Editor Line Numbers</span>
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
