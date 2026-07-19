import { SOURCES, RATINGS, STAGES, AGENTS } from './constants.js';
import { add } from './store.js';
import { generateId } from '../utils/id-generator.js';

const LEAD_NAMES = [
  'Mohamed Ali', 'Sara Ahmed', 'Omar Hassan', 'Fatma Ibrahim', 'Youssef Mohamed',
  'Nour Khalid', 'Ahmed Mansour', 'Layla Farouk', 'Hassan Youssef', 'Mona Said',
  'Tarek Nabil', 'Dina Adel', 'Karim Mostafa', 'Hana Sherif', 'Amr Wagdy',
  'Salma Hossam', 'Mahmoud Reda', 'Yasmin Fouad', 'Ibrahim Khaled', 'Rania Samir',
  'Adel Mahmoud', 'Nada Ashraf', 'Walid Gamal', 'Mayar Osama', 'Sherif Taha',
  'Nehal Bassem', 'Khaled Salah', 'Ghada Farid', 'Hamza Mostafa', 'Inas Abdel-Fattah'
];

const NOTES = [
  'Interested in downtown apartments', 'Follow up next week', 'Budget is flexible',
  'Looking for family compound', 'Urgent - relocation needed', 'Referred by existing client',
  'Wants waterfront view', 'Prefer ground floor', 'Investment buyer', 'First-time buyer',
  'Needs parking space', 'Pet owner - needs pet-friendly', 'Relocating from abroad',
  'Commercial property interest', 'Multiple unit inquiry'
];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate() {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 60));
  return d.toISOString().split('T')[0];
}
function randomPhone() { return '01' + String(Math.floor(10000000 + Math.random() * 90000000)); }

export async function seedLeads() {
  for (let i = 0; i < LEAD_NAMES.length; i++) {
    const name = LEAD_NAMES[i];
    await add('leads', {
      name,
      phone: randomPhone(),
      email: name.toLowerCase().replace(/ /g, '.') + '@example.com',
      source: randomItem(SOURCES),
      rating: randomItem(RATINGS),
      stage: randomItem(STAGES),
      assignedTo: randomItem(AGENTS).id,
      createdDate: randomDate(),
      activityDate: randomDate(),
      assignmentDate: randomDate(),
      note: randomItem(NOTES),
      tags: [randomItem(['vip', 'priority', 'new', 'follow-up', 'contract'])]
    });
  }
}
