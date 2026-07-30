import React from 'react';
import { motion } from 'motion/react';
import logo from '../assets/logo.png';

export const AnimatedSplash = () => {
  return (
    <div className="fixed inset-0 z-[1000] bg-app-bg flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-blue/5 rounded-full blur-[80px] delay-700" />

      <div className="relative flex flex-col items-center">
        {/* Main Logo with Bounce/Floating Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.1, 1],
            opacity: 1,
            y: [0, -15, 0]
          }}
          transition={{
            duration: 1.5,
            times: [0, 0.6, 1],
            y: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
          className="w-40 h-40 drop-shadow-[0_0_25px_rgba(0,255,157,0.3)]"
        >
          <img src={logo} alt="ContaDia PRO" className="w-full h-full object-contain rounded-[2.5rem]" />
        </motion.div>

        {/* Text Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl font-black italic tracking-tighter neon-text-green mb-1">
            CONTADIA PRO
          </h1>
          <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.4em]">
            Seu tempo, seu lucro
          </p>
        </motion.div>

        {/* Loading bar animation */}
        <div className="mt-12 w-48 h-1 bg-app-muted rounded-full overflow-hidden border border-app-border relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-neon-green to-neon-blue neon-glow-green"
          />
        </div>
      </div>

      {/* Version badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12"
      >
        <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-widest">Powered by AI Technology</p>
      </motion.div>
    </div>
  );
};
