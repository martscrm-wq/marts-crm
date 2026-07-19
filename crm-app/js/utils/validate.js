import { SOURCES, RATINGS, STAGES, AGENTS } from '../data/constants.js';

export function validateLead(lead) {
  const errors = [];
  if (!lead.name || lead.name.length < 2 || lead.name.length > 100) errors.push('Name must be 2-100 characters');
  if (!lead.phone || !/^[+]?[0-9]{7,15}$/.test(lead.phone)) errors.push('Phone must be 7-15 digits');
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.push('Invalid email format');
  if (!lead.source || !SOURCES.includes(lead.source)) errors.push('Invalid source');
  if (!lead.rating || !RATINGS.includes(lead.rating)) errors.push('Invalid rating');
  if (!lead.stage || !STAGES.includes(lead.stage)) errors.push('Invalid stage');
  if (!lead.assignedTo || !AGENTS.find(a => a.id === lead.assignedTo)) errors.push('Invalid agent');
  return { valid: errors.length === 0, errors };
}

export function validatePhone(phone) {
  return /^[+]?[0-9]{7,15}$/.test(phone);
}

export function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
