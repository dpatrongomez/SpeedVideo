/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from 'react';
import {
  Gauge,
  User,
  Settings,
  BarChart3,
  Globe,
  Zap,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'speed' | 'settings' | 'stats' | 'domains';

/** Format a speed value with the minimum necessary decimals.
 * 1    → "1.0"  |  1.5 → "1.5"  |  1.25 → "1.25" */
const formatSpeed = (s: number) => {
  const fixed2 = parseFloat(s.toFixed(2));
  if (fixed2 % 1 === 0) return fixed2.toFixed(1);        // whole number → "1.0"
  if (Math.round(fixed2 * 10) === fixed2 * 10) return fixed2.toFixed(1); // 1 decimal → "1.5"
  return fixed2.toFixed(2);                              // 2 decimals → "1.25"
};


// Helper to send a message to the active tab's content script
async function sendToActiveTab(message: Record<string, unknown>) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id != null) {
      await chrome.tabs.sendMessage(tab.id, message);
    }
  } catch {
    // Tab may not have a content script (e.g. chrome:// pages) – silently ignore
  }
}

export default function App() {
  const [speed, setSpeed] = useState(1.5);
  const [activeTab, setActiveTab] = useState<Tab>('speed');
  const [isEnabled, setIsEnabled] = useState(true);

  const quickSpeeds = [0.5, 1.0, 1.25, 1.5, 2.0];

  // Load settings on mount: prefer the actual video speed from the content script,
  // fall back to the stored value if the content script is not available.
  useEffect(() => {
    chrome.storage.sync.get(['speed', 'isEnabled'], async (result) => {
      // Apply stored enabled state immediately
      if (result.isEnabled != null) setIsEnabled(result.isEnabled);

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id != null) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SPEED' });
          if (response?.speed != null) {
            setSpeed(response.speed);
            return; // Use the live video speed, skip storage value
          }
        }
      } catch {
        // Content script not injected on this page – fall back to stored value
      }

      if (result.speed != null) setSpeed(result.speed);
    });
  }, []);

  // Listen for speed changes from the content script (keyboard shortcuts)
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'SPEED_CHANGED' && typeof message.speed === 'number') {
        setSpeed(message.speed);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // When speed changes: persist and apply to active tab
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    chrome.storage.sync.set({ speed: newSpeed });
    sendToActiveTab({ type: 'SET_SPEED', speed: newSpeed });
  };

  // When enabled toggle changes
  const handleToggleEnabled = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    chrome.storage.sync.set({ isEnabled: next });
    sendToActiveTab({ type: 'SET_ENABLED', enabled: next });
    if (next) {
      sendToActiveTab({ type: 'SET_SPEED', speed });
    }
  };

  return (
    <div className="w-[350px] h-[550px] bg-surface flex flex-col overflow-hidden relative shadow-2xl border border-outline-variant/10">
      {/* Header */}
      <header className="flex justify-between items-center px-4 h-14 bg-surface-lowest/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-primary font-headline tracking-tight">
            SpeedVideo
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Switch */}
          <button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-primary' : 'bg-surface-highest'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
            />
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-6 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'speed' && (
            <motion.div
              key="speed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center gap-8"
            >
              {/* Velocity Display */}
              <div className="text-center relative">
                <span className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-1">
                  Current Velocity
                </span>
                <div className="relative inline-block">
                  <motion.span
                    key={speed}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-extrabold font-headline text-primary tracking-tighter"
                  >
                    {formatSpeed(speed)}
                    <span className="text-2xl font-bold opacity-40 ml-1">x</span>
                  </motion.span>
                  {/* Abstract Glow */}
                  <div className="absolute -inset-8 bg-primary/5 blur-3xl rounded-full -z-10" />
                </div>
              </div>

              {/* Slider Card */}
              <div className="w-full bg-surface-lowest rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,51,70,0.04)] border border-outline-variant/5">
                <div className="flex justify-between items-center mb-5">
                  <History size={14} className="text-on-surface-variant" />
                  <Zap size={14} className="text-on-surface-variant" />
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />

                <div className="flex justify-between mt-3">
                  <span className="text-[10px] font-semibold text-on-surface-variant/60">0.1x</span>
                  <span className="text-[10px] font-semibold text-on-surface-variant/60">1.0x</span>
                  <span className="text-[10px] font-semibold text-on-surface-variant/60">5.0x</span>
                </div>
              </div>

              {/* Quick Selection */}
              <div className="grid grid-cols-5 gap-2 w-full">
                {quickSpeeds.map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSpeedChange(val)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all duration-300 ${speed === val
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'bg-surface-low text-on-surface-variant hover:bg-surface-highest'
                      }`}
                  >
                    {formatSpeed(val)}
                  </button>
                ))}
              </div>

              {/* Additional Info */}
              <div className="w-full mt-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary">Pro Tip:</span> Use <kbd className="px-1 py-0.5 bg-white rounded border border-outline-variant/20 text-[9px]">S</kbd> and <kbd className="px-1 py-0.5 bg-white rounded border border-outline-variant/20 text-[9px]">D</kbd> to adjust speed instantly on any video player.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-bold font-headline text-on-surface">Extension Settings</h2>
              <div className="space-y-2">
                {[
                  'Show speed overlay',
                  'Remember speed per site',
                  'Enable keyboard shortcuts',
                  'Sync across devices'
                ].map((setting, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-surface-lowest rounded-xl border border-outline-variant/5">
                    <span className="text-xs font-medium text-on-surface-variant">{setting}</span>
                    <div className="w-8 h-4 bg-primary/20 rounded-full relative">
                      <div className="absolute right-1 top-1 w-2 h-2 bg-primary rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-10"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <BarChart3 size={32} />
              </div>
              <h2 className="text-sm font-bold font-headline">Usage Analytics</h2>
              <p className="text-xs text-on-surface-variant px-4">
                You've saved approximately <span className="text-primary font-bold">4.2 hours</span> of watch time this week by using SpeedVideo.
              </p>
            </motion.div>
          )}

          {activeTab === 'domains' && (
            <motion.div
              key="domains"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold font-headline">Active Domains</h2>
                <button className="text-[10px] font-bold text-primary uppercase tracking-wider">Add New</button>
              </div>
              <div className="space-y-2">
                {['youtube.com', 'netflix.com', 'vimeo.com', 'twitch.tv'].map((domain) => (
                  <div key={domain} className="flex items-center gap-3 p-3 bg-surface-lowest rounded-xl border border-outline-variant/5">
                    <div className="w-6 h-6 bg-surface-low rounded flex items-center justify-center">
                      <Globe size={12} className="text-primary" />
                    </div>
                    <span className="text-xs font-medium text-on-surface-variant flex-1">{domain}</span>
                    <span className="text-[10px] font-bold text-primary/60">Active</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="absolute bottom-0 left-0 w-full bg-surface-lowest/80 backdrop-blur-xl border-t border-outline-variant/10 px-6 py-3 flex justify-between items-center">
        <NavButton
          active={activeTab === 'speed'}
          onClick={() => setActiveTab('speed')}
          icon={<Gauge size={20} />}
          label="Speed"
        />
        <NavButton
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          icon={<Settings size={20} />}
          label="Settings"
        />
        <NavButton
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
          icon={<BarChart3 size={20} />}
          label="Stats"
        />
        <NavButton
          active={activeTab === 'domains'}
          onClick={() => setActiveTab('domains')}
          icon={<Globe size={20} />}
          label="Domains"
        />
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${active ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
        }`}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute -inset-x-3 -inset-y-1 bg-primary/10 rounded-xl -z-10"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div className={active ? 'scale-110' : 'scale-100'}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
