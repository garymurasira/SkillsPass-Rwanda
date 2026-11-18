// All prototype data lives here. Replace with real data sources later.

export type SkillType = { id: string; slug: string; nameEn: string; nameRw: string; nameFr: string };

export const skillTypes: SkillType[] = [
  { id: "s1", slug: "electrician", nameEn: "Electrician", nameRw: "Umuyagankuba", nameFr: "Électricien" },
  { id: "s2", slug: "plumber", nameEn: "Plumber", nameRw: "Umufundi w'amazi", nameFr: "Plombier" },
  { id: "s3", slug: "carpenter", nameEn: "Carpenter", nameRw: "Umubaji", nameFr: "Menuisier" },
  { id: "s4", slug: "solar-technician", nameEn: "Solar technician", nameRw: "Umutekinisiye w'imirasire", nameFr: "Technicien solaire" },
  { id: "s5", slug: "mechanic", nameEn: "Mechanic", nameRw: "Umukanishi", nameFr: "Mécanicien" },
  { id: "s6", slug: "mason", nameEn: "Mason", nameRw: "Umufundi", nameFr: "Maçon" },
  { id: "s7", slug: "welder", nameEn: "Welder", nameRw: "Usudira", nameFr: "Soudeur" },
];

const sk = (slug: string) => skillTypes.find((s) => s.slug === slug)!;
const img = (seed: string, size = 400) => `https://picsum.photos/seed/${seed}/${size}/${size}`;

export type Review = { stars: number; comment: string; createdAt: string; employer: string };
export type Worker = {
  id: string;
  name: string;
  photoUrl: string;
  region: string;
  city: string;
  bio: string;
  mainSkill: { skillType: SkillType; yearsOfExperience: number; verified: boolean };
  otherSkills: { skillType: SkillType; yearsOfExperience: number }[];
  portfolio: { id: string; url: string }[];
  rating: { average: number; count: number };
  reviews: Review[];
  phone: string | null;
  isFavorite: boolean;
};

const portfolio = (seed: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `${seed}-p${i}`, url: img(`${seed}-work-${i}`, 600) }));

const reviewsA: Review[] = [
  { stars: 5, comment: "Fixed all the wiring in one day. Very clean work.", createdAt: "2026-10-02", employer: "Inzozi Builders" },
  { stars: 4, comment: "Good work, arrived a little late.", createdAt: "2026-09-12", employer: "Kigali Homes Ltd" },
  { stars: 5, comment: "Honest and careful. We will hire again.", createdAt: "2026-08-20", employer: "Ubumwe Hotel" },
];

const base: [string, string, string, string, string, number, number, number][] = [
  ["Jean Bosco Niyonzima", "Kigali", "Gasabo", "electrician", "bosco", 8, 4.7, 23],
  ["Claudine Uwase", "Kigali", "Kicukiro", "plumber", "claudine", 5, 4.4, 11],
  ["Eric Habimana", "Southern", "Huye", "carpenter", "eric", 12, 4.9, 31],
  ["Aline Mukamana", "Eastern", "Rwamagana", "solar-technician", "aline", 4, 4.2, 6],
  ["Patrick Nshimiyimana", "Western", "Rubavu", "mechanic", "patrick", 10, 3.8, 9],
  ["Emmanuel Hakizimana", "Northern", "Musanze", "mason", "emmanuel", 15, 4.6, 18],
  ["Diane Ingabire", "Kigali", "Nyarugenge", "welder", "diane", 6, 0, 0],
  ["Olivier Mugisha", "Southern", "Muhanga", "electrician", "olivier", 3, 4.0, 4],
  ["Grace Uwimana", "Eastern", "Nyagatare", "plumber", "grace", 7, 0, 0],
  ["Samuel Tuyishime", "Western", "Rusizi", "carpenter", "samuel", 9, 4.5, 14],
  ["Vestine Nyirahabimana", "Northern", "Gicumbi", "mason", "vestine", 11, 3.5, 7],
  ["Innocent Bizimana", "Kigali", "Gasabo", "solar-technician", "innocent", 2, 4.8, 5],
];

export const workers: Worker[] = base.map(([name, region, city, slug, seed, years, avg, count], i) => ({
  id: `w${i + 1}`,
  name,
  photoUrl: img(`face-${seed}`, 300),
  region,
  city,
  bio: `I am a ${sk(slug).nameEn.toLowerCase()} with ${years} years of work in ${city}. I work carefully and finish on time.`,
  mainSkill: { skillType: sk(slug), yearsOfExperience: years, verified: true },
  otherSkills: i % 3 === 0 ? [{ skillType: sk("welder"), yearsOfExperience: 2 }] : i % 3 === 1 ? [{ skillType: sk("mason"), yearsOfExperience: 3 }] : [],
  portfolio: portfolio(seed, 4 + (i % 5)),
  rating: { average: avg, count },
  reviews: count ? reviewsA.slice(0, Math.min(3, count)) : [],
  phone: i === 0 ? "+250 788 123 456" : null,
  isFavorite: i === 1 || i === 2,
}));

export const currentWorker = {
  ...workers[0],
  id: "me",
  name: "Jean Claude Mutabazi",
  photoUrl: "",
  region: "Kigali",
  city: "Kicukiro",
  bio: "",
  mainSkill: { skillType: sk("electrician"), yearsOfExperience: 6, verified: false },
  otherSkills: [
    { skillType: sk("solar-technician"), yearsOfExperience: 2 },
    { skillType: sk("welder"), yearsOfExperience: 1 },
  ],
  portfolio: portfolio("me", 5),
  rating: { average: 4.6, count: 5 },
  reviews: reviewsA,
  phone: "+250 788 555 010",
  isFavorite: false,
  shareContact: false,
  profileComplete: false,
  missing: ["photo", "bio"] as string[],
  visibleToEmployers: false,
};

export type RefResult = "pending" | "confirmed" | "not_confirmed" | "unreachable";

export const verification = {
  status: "in_progress" as "none" | "in_progress" | "verified",
  canSubmit: true,
  rounds: [
    {
      id: "r1",
      roundNumber: 1,
      status: "open",
      references: [
        { id: "ref1", name: "Marie Mukeshimana", relationship: "Customer", result: "confirmed" as RefResult },
        { id: "ref2", name: "Theogene Ndayisaba", relationship: "Supervisor", result: "pending" as RefResult },
        { id: "ref3", name: "Alice Umutoni", relationship: "Other", result: "unreachable" as RefResult },
      ],
    },
  ],
};

export type JobStatus = "in_progress" | "employer_marked_done" | "completed";
export type Job = {
  id: string;
  status: JobStatus;
  createdAt: string;
  employerMarkedAt: string | null;
  workerConfirmedAt: string | null;
  worker: { id: string; name: string };
  employer: { id: string; companyName: string };
  canRate: boolean;
};

export const jobs: Job[] = [
  { id: "j1", status: "in_progress", createdAt: "2026-11-10", employerMarkedAt: null, workerConfirmedAt: null, worker: { id: "w1", name: "Jean Bosco Niyonzima" }, employer: { id: "e1", companyName: "Inzozi Builders" }, canRate: false },
  { id: "j2", status: "employer_marked_done", createdAt: "2026-11-02", employerMarkedAt: "2026-11-08", workerConfirmedAt: null, worker: { id: "w3", name: "Eric Habimana" }, employer: { id: "e2", companyName: "Kigali Homes Ltd" }, canRate: false },
  { id: "j3", status: "completed", createdAt: "2026-10-15", employerMarkedAt: "2026-10-20", workerConfirmedAt: "2026-10-21", worker: { id: "w2", name: "Claudine Uwase" }, employer: { id: "e3", companyName: "Ubumwe Hotel" }, canRate: true },
];

export const conversations = [
  { peer: { id: "c1", name: "Alexis Kamanzi", photoUrl: img("face-alexis", 200), companyName: "Inzozi Builders" }, lastMessage: { content: "Can you come on Monday at 8?", sentAt: "09:42", fromMe: false }, unreadCount: 2 },
  { peer: { id: "c2", name: "Josiane Uwera", photoUrl: img("face-josiane", 200), companyName: "Kigali Homes Ltd" }, lastMessage: { content: "Thank you, see you soon.", sentAt: "Yesterday", fromMe: true }, unreadCount: 0 },
];

export const messages = [
  { id: "m1", seq: 1, content: "Hello, I saw your profile. Are you free next week?", sentAt: "09:10", fromMe: false, readAt: "09:11" },
  { id: "m2", seq: 2, content: "Hello. Yes, I am free.", sentAt: "09:12", fromMe: true, readAt: "09:13" },
  { id: "m3", seq: 3, content: "We need new wiring in a small house in Gasabo.", sentAt: "09:14", fromMe: false, readAt: "09:15" },
  { id: "m4", seq: 4, content: "How many rooms?", sentAt: "09:16", fromMe: true, readAt: "09:16" },
  { id: "m5", seq: 5, content: "Four rooms and a kitchen.", sentAt: "09:20", fromMe: false, readAt: "09:21" },
  { id: "m6", seq: 6, content: "OK. I can do it in two days.", sentAt: "09:25", fromMe: true, readAt: "09:30" },
  { id: "m7", seq: 7, content: "Good. Can you come on Monday?", sentAt: "09:40", fromMe: false, readAt: null },
  { id: "m8", seq: 8, content: "Can you come on Monday at 8?", sentAt: "09:42", fromMe: false, readAt: null },
];

export const adminRounds = [
  {
    id: "ar1", roundNumber: 1, status: "open", createdAt: "2026-11-12",
    worker: { id: "me", name: "Jean Claude Mutabazi", region: "Kigali", city: "Kicukiro" },
    skill: { name: "Electrician", yearsOfExperience: 6, status: "pending" },
    references: [
      { id: "x1", name: "Marie Mukeshimana", phone: "+250788100200", relationship: "Customer", result: "confirmed" as RefResult, recordedAt: "2026-11-13 10:20" as string | null },
      { id: "x2", name: "Theogene Ndayisaba", phone: "+250788100201", relationship: "Supervisor", result: "pending" as RefResult, recordedAt: null as string | null },
      { id: "x3", name: "Alice Umutoni", phone: "+250788100202", relationship: "Other", result: "unreachable" as RefResult, recordedAt: "2026-11-13 11:05" as string | null },
    ],
  },
  {
    id: "ar2", roundNumber: 1, status: "verified", createdAt: "2026-11-01",
    worker: { id: "w3", name: "Eric Habimana", region: "Southern", city: "Huye" },
    skill: { name: "Carpenter", yearsOfExperience: 12, status: "verified" },
    references: [
      { id: "y1", name: "Pacifique Iradukunda", phone: "+250788200300", relationship: "Customer", result: "confirmed" as RefResult, recordedAt: "2026-11-02 09:00" as string | null },
      { id: "y2", name: "Solange Mutesi", phone: "+250788200301", relationship: "Customer", result: "confirmed" as RefResult, recordedAt: "2026-11-02 09:30" as string | null },
      { id: "y3", name: "Fabrice Gatete", phone: "+250788200302", relationship: "Supervisor", result: "pending" as RefResult, recordedAt: null as string | null },
    ],
  },
  {
    id: "ar3", roundNumber: 2, status: "not_verified", createdAt: "2026-10-20",
    worker: { id: "w5", name: "Patrick Nshimiyimana", region: "Western", city: "Rubavu" },
    skill: { name: "Mechanic", yearsOfExperience: 10, status: "not_verified" },
    references: [
      { id: "z1", name: "Didier Manzi", phone: "+250788300400", relationship: "Customer", result: "not_confirmed" as RefResult, recordedAt: "2026-10-21 14:00" as string | null },
      { id: "z2", name: "Yvonne Keza", phone: "+250788300401", relationship: "Other", result: "not_confirmed" as RefResult, recordedAt: "2026-10-21 14:30" as string | null },
      { id: "z3", name: "Jules Rukundo", phone: "+250788300402", relationship: "Supervisor", result: "unreachable" as RefResult, recordedAt: "2026-10-21 15:00" as string | null },
    ],
  },
];

export const flaggedSkills = [
  { id: "f1", worker: { id: "w8", name: "Olivier Mugisha" }, skill: "Electrician", yearsOfExperience: 3, status: "flagged" },
  { id: "f2", worker: { id: "w11", name: "Vestine Nyirahabimana" }, skill: "Mason", yearsOfExperience: 11, status: "flagged" },
];
