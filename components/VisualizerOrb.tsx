
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import './VisualizerOrb.css';

export const VisualizerOrb: React.FC = () => {
  const { volume, connected, connect, disconnect } = useLiveAPIContext();
  
  const handleOrbClick = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  // Create an array of values for the visualizer bars
  const bars = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  // Multiply volume to make the orb more visually responsive (RMS is typically low)
  const visualVolume = Math.min(1, volume * 8);

  return (
    <div className="visualizer-orb-container">
      <motion.div 
        className={`orb ${connected ? 'connected' : 'idle'}`}
        onClick={handleOrbClick}
        animate={{
          scale: connected ? 1 + visualVolume * 0.25 : 1,
          boxShadow: connected 
            ? `0 0 ${20 + visualVolume * 80}px rgba(68, 141, 255, ${0.4 + visualVolume * 0.6})`
            : '0 0 20px rgba(255, 255, 255, 0.1)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="orb-inner">
          <div className="visualizer-bars">
            {bars.map((i) => (
              <motion.div
                key={i}
                className="bar"
                animate={{
                  height: connected ? `${10 + visualVolume * (50 + Math.random() * 40)}%` : '10%',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  delay: i * 0.01,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {!connected && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="orb-status-text"
          >
            Tap to start Eburon Worker
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
