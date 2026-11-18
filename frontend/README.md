# Rwanda Skills Passport

Build the **UI layout only** for **SkillsPass Rwanda**, a mobile-first app where informal workers in Rwanda show a verified skills profile and employers search for verified workers. Build every screen below in one pass as a clickable prototype with static mock data. Do not ask me questions.

## Scope: layout only

- **No backend, no Supabase, no real authentication, no API calls, no i18n library, no PWA setup.** Another tool will add all of that later.
- Every form and button just navigates to the next logical screen or shows a toast. Nothing is saved.
- Put ALL mock data in one file, `src/mock/data.ts`, using the field names listed in section 3, so real data can replace it later.
- Keep each screen in its own file under `src/pages/` and reusable pieces under `src/components/`. Use React + Vite + TypeScript + Tailwind + shadcn/ui + React Router. Lazy-load routes.
- English text only. Include the language switcher (RW / EN / FR) as a visual control, with no behavior.

## 1. Design direction

- Users are low-literacy workers on low-end Android phones (360px wide, 4.5"–6.5" screens). Design for that:
  - Mobile-first at 360px. Touch targets at least 48px. Body text at least 14px.
  - Icon-plus-short-label navigation, big photos and icons, one task per screen, very simple wording.
  - Light on images and effects. No heavy animations. Use skeleton loaders on a couple of screens to show the pattern.
- Style: calm, trustworthy and high-contrast. Deep green primary, warm yellow accent, white background, rounded cards, generous spacing.
- A green check **"Verified"** badge appears wherever a verified skill is shown, and a gray **"Not verified"** tag for unverified ones.
- Every list screen needs an empty state, and every screen with data needs a loading skeleton and an error-with-retry variant (reachable from a small "preview states" switch on a hidden `/states` page, or via a `?state=empty|loading|error` URL param).
- Worker and employer screens use a **bottom tab bar** on mobile. Admin screens use a **sidebar layout** for desktop and tablet.
- **Responsive behavior (required):** design mobile-first, then adapt at Tailwind breakpoints.
  - **Worker screens:** phone layout up to `md`. On `md` and above, keep a centered column (max ~480px) with the bottom tab bar kept inside that column.
  - **Employer screens:** employers mostly use laptops, so do NOT use a phone column. Below `md`, use the phone layout with the bottom tabs. At `md` and above, switch the bottom tabs to a **left sidebar or top nav**. The worker search becomes a **two-column layout** (filter panel pinned on the left, results in a 2 to 3 column card grid on the right at `lg`). Worker detail becomes two columns (photo and actions on the left, bio, portfolio and reviews on the right). Chat becomes a split view (conversation list on the left, thread on the right).
  - **Admin screens:** sidebar layout from `md` upward. Tables scroll horizontally on small screens, or collapse into stacked cards below `md`.
  - Nothing may scroll horizontally on a 360px screen, and images must scale to their container.

## 2. Screens and navigation

### Public
1. **Landing** (`/`): logo, one-sentence promise, two big buttons "I am a worker" and "I am an employer", a "Sign in" link, a language switcher, and a small "Staff sign in" link.
2. **Register** (`/register/worker`, `/register/employer`): a short form.
   - Worker: name, phone, province dropdown, district dropdown.
   - Employer: name, phone, company name, province, district, contact info.
   - Then the **OTP screen** (`/otp`): a 6-digit code input with a big numeric keypad, a "Resend code in 60s" countdown, and a "Wrong number?" link. The Continue button goes to the worker or employer home depending on which flow it came from.
3. **Sign in** (`/login`): phone number, then the same OTP screen. Include a "No account yet? Register" link.
4. **Staff sign in** (`/admin/login`): phone, OTP code and authenticator code on one screen (desktop-friendly).

### Worker app (`/worker/*`, bottom tabs: Profile, Verify, Jobs, Messages, Settings)
5. **Profile**
   - A big round photo with a camera button, name, location.
   - A **status banner** with two variants. One is a yellow "Not visible to employers yet" banner with a checklist (Add a photo, Add a short bio, Choose your main skill). The other is a green "Employers can find you" banner. Include a toggle in the prototype to preview both.
   - Bio, main skill card (skill icon, years of experience, Verified or Pending badge), an "Other skills" list with a gray "Not verified" tag, and a portfolio photo grid (up to 12 tiles, with an "Add photo" tile and a delete button on each).
   - An "Edit profile" button.
6. **Edit profile** (`/worker/profile/edit`): name, province, district, bio (300-character counter) and a toggle "Let employers see my phone number" (off by default).
7. **Choose main skill** (`/worker/skill`): big tappable icon cards for 7 skills (Electrician, Plumber, Carpenter, Solar technician, Mechanic, Mason, Welder), then a years-of-experience stepper (0–60). Include a **warning dialog** shown when changing to a different skill ("Changing your main skill will remove your Verified status and hide you from employers").
8. **Add other skill** (`/worker/skills/add`): the same skill cards plus years.
9. **Verify**
   - Empty state: "Choose a main skill first".
   - A **3-reference form**: three stacked cards, each with name, phone, and a relationship chip choice (Customer, Supervisor, Other), plus a "Submit for verification" button.
   - A **status view** after submission: a simple timeline where each of the 3 references shows an icon for its state (clock = pending, green check = confirmed, red cross = not confirmed, phone-off = unreachable) and one line saying "A skill becomes Verified when 2 references confirm."
   - Show both the form view and the status view, switchable in the prototype with the `?state=` param.
10. **Jobs** (`/worker/jobs`): a list of job cards (employer company, date, status chip: In progress, Employer marked done, Completed). A job in "Employer marked done" shows a big **"Confirm job completed"** button. Plus a **My ratings** page (`/worker/ratings`) with an average star display and a list of reviews.
11. **Messages** (`/worker/messages`): a conversation list (peer photo, name or company, last message, unread dot) and a **chat thread** (`/worker/messages/:id`) with simple bubbles and a big send button. Workers can only reply, so the thread screen has a reply box and the list has no "new message" button.
12. **Settings** (`/worker/settings`): language switcher, "Change phone number" (a two-step screen: new number, then OTP), logout.

### Employer app (`/employer/*`, bottom tabs: Find, Favorites, Jobs, Messages, Settings)
13. **Find** (`/employer`)
    - A collapsible **filter panel**: skill (icon chips), province, district, and minimum rating (1–5 stars). No text search and no sort control.
    - A result list of **worker cards**: photo, name, Verified skill badge, years of experience, location, star rating with count (or "No ratings yet"), and a heart toggle.
    - A "Load more" button, and an empty state ("No verified workers match your search yet. Try fewer filters.").
14. **Worker detail** (`/employer/workers/:id`)
    - A photo header, name, location, a Verified badge with skill and years, bio.
    - A portfolio gallery that opens a full-screen image viewer.
    - "Other skills" with the gray "Not verified" tag, a rating summary, and a reviews list (stars, comment, employer name, date).
    - A sticky bottom action bar: **Send message**, **Start job**, and a heart toggle. A "Call" button appears only in one mock worker whose phone is shared.
    - A "This worker is no longer available" variant screen.
15. **Favorites** (`/employer/favorites`): the same worker cards, plus an empty state.
16. **Jobs** (`/employer/jobs`): job cards with a status filter. An "In progress" job shows **"Mark as completed"**. A completed, unrated job shows **"Rate this worker"**, which opens a bottom sheet with a 1–5 star picker, an optional comment (200-character counter) and a submit button.
17. **Messages** (`/employer/messages`): the conversation list and thread, the same as the worker's but with a "new message" entry through the worker detail page.
18. **Settings** (`/employer/settings`): company profile form (name, company name, province, district, contact info), language, change phone, logout.

### Admin (`/admin/*`, sidebar layout, desktop and tablet first)
19. **Verification queue** (`/admin`): tabs Open / Verified / Not verified, and a table of rounds (worker, skill, province and district, date, a "n of 3 recorded" indicator) with a "Load more" button.
20. **Round detail** (`/admin/rounds/:id`): worker and skill summary, then the 3 references with their **phone numbers** (as `tel:` links). Each reference has three segmented buttons: Confirmed, Not confirmed, Unreachable, and a "recorded at" timestamp. A short explanation: "Two confirmations verify the skill. There is no manual approve button." Include a disabled "round closed" variant.
21. **Flagged skills** (`/admin/flagged`): a table (worker, skill, years, status) with a "Clear flag" button on each row.

Also add a small `/states` page listing links to the empty, loading and error variants of the main screens, so I can review them quickly.

## 3. Mock data (in `src/mock/data.ts`; use these field names)

- `skillTypes`: 7 items `{ id, slug, nameEn, nameRw, nameFr }` for electrician, plumber, carpenter, solar-technician, mechanic, mason, welder. Use a simple icon for each.
- `workers`: 12 items `{ id, name, photoUrl, region, city, bio, mainSkill:{ skillType, yearsOfExperience, verified }, otherSkills:[{ skillType, yearsOfExperience }], portfolio:[{ id, url }], rating:{ average, count }, reviews:[{ stars, comment, createdAt, employer }], phone (null for all except one), isFavorite }`. Use realistic Rwandan names, varied ratings, and a couple of unrated workers (count 0). Use placeholder images only.
- `currentWorker` (the signed-in worker): the same shape plus `shareContact`, `profileComplete`, `missing: ["photo","bio"]` and `visibleToEmployers`.
- `verification`: `{ status, canSubmit, rounds:[{ id, roundNumber, status, references:[{ id, name, relationship, result }] }] }`.
- `jobs`: 3 items `{ id, status, createdAt, employerMarkedAt, workerConfirmedAt, worker:{ id, name }, employer:{ id, companyName }, canRate }`, one per status.
- `conversations`: 2 items `{ peer:{ id, name, photoUrl, companyName }, lastMessage:{ content, sentAt, fromMe }, unreadCount }`, and a `messages` thread of about 8 messages `{ id, seq, content, sentAt, fromMe, readAt }`.
- `adminRounds`: 3 items `{ id, roundNumber, status, createdAt, worker:{ id, name, region, city }, skill:{ name, yearsOfExperience, status }, references:[{ id, name, phone, relationship, result, recordedAt }] }`.
- `flaggedSkills`: 2 items `{ id, worker:{ id, name }, skill, yearsOfExperience, status }`.
- Provinces and districts for the dropdowns, in `src/mock/locations.ts`: Kigali (Gasabo, Kicukiro, Nyarugenge), Northern (Burera, Gakenke, Gicumbi, Musanze, Rulindo), Southern (Gisagara, Huye, Kamonyi, Muhanga, Nyamagabe, Nyanza, Nyaruguru, Ruhango), Eastern (Bugesera, Gatsibo, Kayonza, Kirehe, Ngoma, Nyagatare, Rwamagana), Western (Karongi, Ngororero, Nyabihu, Nyamasheke, Rubavu, Rusizi, Rutsiro).

## 4. Rules

1. Layout and navigation only. Do not write network code, token handling, validation logic, i18n or service workers.
2. Do not add features that are not listed: no portfolio captions, no worker sort, no name search, no payments, no job postings, no user management or dashboards for admin.
3. Do not show a "Message" button on the worker side. Workers can only reply.
4. Reuse components: `WorkerCard`, `SkillBadge`, `StatusBanner`, `JobCard`, `StarRating`, `BottomTabBar`, `OtpInput`, `PhotoGrid`, `EmptyState`, `Skeleton`, `ErrorRetry`.
5. Keep components small, text in plain JSX, and the visual language consistent across all three roles.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
