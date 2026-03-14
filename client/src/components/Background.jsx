import { motion } from 'framer-motion';

const Background = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#fcfcfc]">
      <div className="bg-mesh" />
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Subtle Fintech Animated Blurs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#867361]/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.02, 0.04, 0.02],
          x: [0, -40, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#9d9286]/10 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2"
      />

      <motion.div
        animate={{
          opacity: [0, 0.02, 0],
          scale: [0.9, 1, 0.9]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#867361]/5 blur-[180px] rounded-full"
      />
    </div>
  );
};


export default Background;
