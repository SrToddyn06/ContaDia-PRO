import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import logo from '../assets/logo.png';

export const AnimatedSplash = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[1000] bg-app-bg flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green/10 rounded-full blur-[100px]" />

      <div className="relative flex flex-col items-center">
        {/* Main Logo with Bounce Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.05, 1],
            opacity: 1,
          }}
          transition={{
            duration: 1,
            ease: "easeOut"
          }}
          className="w-32 h-32 mb-6"
        >
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-contain rounded-3xl shadow-2xl"
              onError={(e) => {
                // Fallback to icon if image fails to load
                (e.target as any).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-neon-green/20 rounded-3xl flex items-center justify-center">
              <Zap className="w-16 h-16 text-neon-green" />
            </div>
          )}
        </motion.div>

        {/* Text Animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl font-black italic tracking-tighter neon-text-green">
            CONTADIA PRO
          </h1>
        </motion.div>

        {/* Loading indicator */}
        <div className="mt-8 w-32 h-1 bg-app-muted rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "linear" }}
            className="h-full bg-neon-green"
          />
        </div>
      </div>
    </motion.div>
  );
};
