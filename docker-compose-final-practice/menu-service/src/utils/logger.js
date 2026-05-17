// Lightweight logger to avoid external dependencies while keeping consistent output
function createLogger(context) {
  const prefix = `[${context}]`;
  const isDebug = (process.env.LOG_LEVEL || '').toLowerCase() === 'debug';

  return {
    info: (...args) => console.log(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
    debug: (...args) => {
      if (isDebug) {
        console.debug(prefix, ...args);
      }
    }
  };
}

module.exports = { createLogger };
