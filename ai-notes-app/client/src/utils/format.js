export const CATEGORIES = ['Personal', 'Work', 'Meeting', 'Study', 'Ideas', 'Other'];

export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Appends an AI result to a note's content under a small heading.
export const appendResult = (content, label, text) => `${content.trimEnd()}\n\n--- ${label} ---\n${text}\n`;
