// Replaced confetti with Welcome Animation Trigger
// Keeping the function names to avoid refactoring all imports

export const triggerConfetti = (message: string = "Welcome Back") => {
    window.dispatchEvent(new CustomEvent('welcome-animation', { detail: { message } }));
};

export const triggerSimpleConfetti = () => {
    // For "simple" triggers (like tab return), we use the same animation but maybe default text
    window.dispatchEvent(new CustomEvent('welcome-animation', { detail: { message: "Welcome Back" } }));
};
