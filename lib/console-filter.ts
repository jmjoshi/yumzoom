// Console error filter for development
// This helps reduce noise from known non-critical warnings

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // Filter known non-critical warnings
  const ignoredWarnings = [
    'Download the React DevTools',
    'Multiple GoTrueClient instances detected',
    'Warning: ReactDOM.render is deprecated',
    'Warning: findDOMNode is deprecated',
  ];

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Skip known non-critical warnings
    if (ignoredWarnings.some(warning => message.includes(warning))) {
      return;
    }
    
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Skip known non-critical warnings
    if (ignoredWarnings.some(warning => message.includes(warning))) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
}

export {};
