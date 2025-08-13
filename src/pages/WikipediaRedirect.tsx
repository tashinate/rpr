// Instant redirect to Wikipedia random - no loading states
const WikipediaRedirect = () => {
  // Immediate redirect to Wikipedia random page
  window.location.replace('https://en.wikipedia.org/wiki/Special:Random');
  return null;
};

export default WikipediaRedirect;