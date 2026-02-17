import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function WelcomeAnimation() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleWelcome = () => {
            setIsVisible(true);
            // Show for 4 seconds to allow time for waving
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 4000);
            return () => clearTimeout(timer);
        };

        window.addEventListener('welcome-animation', handleWelcome);
        return () => window.removeEventListener('welcome-animation', handleWelcome);
    }, []);

    // Waving Hand Component
    const WavingHand = () => (
        <motion.g
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, -5, 15, 0] }}
            transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatDelay: 0.2,
                ease: "easeInOut"
            }}
            style={{ originX: "80px", originY: "60px" }} // Pivot at shoulder connection
        >
            {/* Arm - now black */}
            <path d="M 80,60 Q 95,50 110,30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" className="text-slate-900 dark:text-slate-100" />
            {/* Hand - now black */}
            <circle cx="110" cy="30" r="8" fill="currentColor" className="text-slate-900 dark:text-slate-100" />
        </motion.g>
    );

    // Blinking Eyes
    const Eyes = () => (
        <motion.g>
            <motion.ellipse
                cx="35" cy="45" rx="3" ry="4"
                fill="currentColor" className="text-slate-700"
                animate={{ ry: [4, 0.5, 4] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1] }}
            />
            <motion.ellipse
                cx="65" cy="45" rx="3" ry="4"
                fill="currentColor" className="text-slate-700"
                animate={{ ry: [4, 0.5, 4] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1] }}
            />
        </motion.g>
    );

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="fixed bottom-8 right-8 z-[100] cursor-pointer"
                    onClick={() => setIsVisible(false)}
                >
                    {/* Speech Bubble */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-12 -left-16 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-border whitespace-nowrap"
                    >
                        <span className="text-sm font-bold text-primary">Welcome Back!</span>
                        <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-border transform rotate-45"></div>
                    </motion.div>

                    {/* Mascot SVG - With "Happy Bounce" */}
                    <div className="w-24 h-24 filter drop-shadow-xl hover:scale-105 transition-transform duration-200">
                        <motion.svg
                            viewBox="0 0 120 100"
                            className="w-full h-full overflow-visible"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {/* Envelope Body */}
                            <rect x="10" y="20" width="80" height="60" rx="4" fill="currentColor" className="text-primary" />

                            {/* Flap (Lighter) */}
                            <path d="M 10,20 L 50,55 L 90,20" fill="currentColor" className="text-primary/80" />

                            {/* Envelope Fold Lines (Bottom) */}
                            <path d="M 10,80 L 45,55" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="text-white" />
                            <path d="M 90,80 L 55,55" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="text-white" />

                            {/* Face Background (White Sticker) */}
                            <rect x="25" y="35" width="50" height="35" rx="8" fill="white" />

                            {/* Bigger, Cuter Eyes */}
                            <motion.g>
                                <motion.ellipse
                                    cx="35" cy="48" rx="4" ry="5.5"
                                    fill="currentColor" className="text-slate-800"
                                    animate={{ ry: [5.5, 0.5, 5.5] }}
                                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1], delay: 1 }}
                                />
                                <motion.ellipse
                                    cx="65" cy="48" rx="4" ry="5.5"
                                    fill="currentColor" className="text-slate-800"
                                    animate={{ ry: [5.5, 0.5, 5.5] }}
                                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1], delay: 1 }}
                                />
                                {/* Eye Shine/Highlight */}
                                <circle cx="37" cy="46" r="1.5" fill="white" />
                                <circle cx="67" cy="46" r="1.5" fill="white" />
                            </motion.g>

                            {/* Big Happy Smile (Deeper curve + dimples) */}
                            <path d="M 38,58 Q 50,70 62,58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" className="text-slate-800" />
                            <path d="M 37,57 L 38,58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-800" />
                            <path d="M 63,57 L 62,58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-800" />

                            {/* Rosy Cheeks (Darker pink) */}
                            <circle cx="30" cy="58" r="3.5" fill="#f472b6" opacity="0.6" />
                            <circle cx="70" cy="58" r="3.5" fill="#f472b6" opacity="0.6" />

                            {/* Waving Arm */}
                            <WavingHand />

                            {/* Legs (Static) */}
                            <path d="M 35,80 L 35,90 L 30,90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" className="text-slate-700" />
                            <path d="M 65,80 L 65,90 L 70,90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" className="text-slate-700" />
                        </motion.svg>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
