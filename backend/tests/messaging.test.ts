import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, createVisibleWorker, employerBody, registerUser, resetDb } from './helpers';
import { prisma } from '../src/shared/prisma';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const send = (token: string, recipientId: string, content = 'Hello') =>
  request(app).post('/api/messages').set(auth(token)).send({ recipientId, content });
const thread = (token: string, peerId: string, qs = '') => request(app).get(`/api/messages/with/${peerId}${qs}`).set(auth(token));
const unread = async (token: string) => (await request(app).get('/api/messages/unread-count').set(auth(token))).body.unread;
const texts = (res: request.Response) => res.body.items.map((m: { content: string }) => m.content);

async function setup() {
  const emp = await registerUser(employerBody());
  const worker = await createVisibleWorker({ name: 'Jean' });
  return { emp: { id: emp.user.id, token: emp.accessToken }, worker };
}

describe('access', () => {
  it('needs a worker or employer login', async () => {
    const { worker } = await setup();
    await request(app).get('/api/messages').expect(401);
    await request(app).post('/api/messages').send({ recipientId: worker.id, content: 'hi' }).expect(401);
    const admin = await createAdmin();
    await request(app).get('/api/messages').set(auth(admin.token)).expect(403);
    await send(admin.token, worker.id).expect(403);
  });
});

describe('who can message whom (BR 2)', () => {
  it('lets an employer message a visible worker', async () => {
    const { emp, worker } = await setup();
    const res = await send(emp.token, worker.id, '  Can you install solar?  ').expect(201);
    expect(res.body).toMatchObject({ content: 'Can you install solar?', fromMe: true, readAt: null });
  });

  it('refuses workers who are not visible, other employers, unknown users and yourself', async () => {
    const { emp } = await setup();
    const pending = await createVisibleWorker({ status: 'PENDING' });
    const otherEmp = await registerUser(employerBody('0722555444'));

    expect((await send(emp.token, pending.id)).body.error.code).toBe('RECIPIENT_NOT_FOUND');
    await send(emp.token, otherEmp.user.id).expect(404);
    await send(emp.token, 'nobody').expect(404);
    expect((await send(emp.token, emp.id)).body.error.code).toBe('CANNOT_MESSAGE_SELF');
  });

  it('stops employers messaging a worker who loses verification, but workers can still reply', async () => {
    const { emp, worker } = await setup();
    await send(emp.token, worker.id, 'First').expect(201);
    await prisma.skill.updateMany({ where: { workerId: worker.id }, data: { status: 'NOT_VERIFIED' } });

    await send(emp.token, worker.id, 'Second').expect(404);
    await send(worker.token, emp.id, 'Reply').expect(201);
  });

  it('does not let workers start conversations', async () => {
    const { emp, worker } = await setup();
    const res = await send(worker.token, emp.id, 'Give me work');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REPLY_ONLY');

    await send(emp.token, worker.id, 'Hi').expect(201);
    await send(worker.token, emp.id, 'Hello, I am available').expect(201);
  });

  it('only lets a worker reply to employers who messaged them', async () => {
    const { emp, worker } = await setup();
    const other = await registerUser(employerBody('0722555444'));
    await send(emp.token, worker.id, 'Hi').expect(201);
    await send(worker.token, other.user.id, 'Hi').expect(403);
  });

  it('validates message content', async () => {
    const { emp, worker } = await setup();
    await send(emp.token, worker.id, '').expect(400);
    await send(emp.token, worker.id, '   ').expect(400);
    await send(emp.token, worker.id, 'x'.repeat(1001)).expect(400);
    await send(emp.token, worker.id, 'x'.repeat(1000)).expect(201);
    expect(await prisma.message.count()).toBe(1);
  });
});

describe('threads (FR 6.2)', () => {
  it('shows the conversation oldest to newest, from each person\'s point of view', async () => {
    const { emp, worker } = await setup();
    await send(emp.token, worker.id, 'Can you install solar?');
    await send(worker.token, emp.id, 'Yes, solar is available tomorrow.');
    await send(emp.token, worker.id, 'Great');

    const asEmployer = await thread(emp.token, worker.id).expect(200);
    expect(texts(asEmployer)).toEqual(['Can you install solar?', 'Yes, solar is available tomorrow.', 'Great']);
    expect(asEmployer.body.items.map((m: { fromMe: boolean }) => m.fromMe)).toEqual([true, false, true]);
    expect(asEmployer.body.items[0].sentAt).toBeTruthy();
    expect(asEmployer.body.peer).toMatchObject({ id: worker.id, name: 'Jean' });

    const asWorker = await thread(worker.token, emp.id).expect(200);
    expect(asWorker.body.items.map((m: { fromMe: boolean }) => m.fromMe)).toEqual([false, true, false]);
    expect(asWorker.body.peer.companyName).toBe('BrightHomes Ltd');
  });

  it('keeps rapid-fire messages in the order they were sent', async () => {
    const { emp, worker } = await setup();
    const ids = ['1', '2', '3', '4', '5', '6', '7', '8'];
    for (const t of ids) await send(emp.token, worker.id, t);
    expect(texts(await thread(emp.token, worker.id))).toEqual(ids);
  });

  it('pages back through history with before=', async () => {
    const { emp, worker } = await setup();
    for (let i = 1; i <= 5; i++) await send(emp.token, worker.id, `m${i}`);

    const latest = await thread(emp.token, worker.id, '?limit=2').expect(200);
    expect(texts(latest)).toEqual(['m4', 'm5']);
    expect(latest.body.hasMore).toBe(true);

    const older = await thread(emp.token, worker.id, `?limit=2&before=${latest.body.items[0].seq}`).expect(200);
    expect(texts(older)).toEqual(['m2', 'm3']);
    expect(older.body.hasMore).toBe(true);

    const oldest = await thread(emp.token, worker.id, `?limit=2&before=${older.body.items[0].seq}`).expect(200);
    expect(texts(oldest)).toEqual(['m1']);
    expect(oldest.body.hasMore).toBe(false);
  });

  it('polls for new messages with after=cursor and sends nothing twice', async () => {
    const { emp, worker } = await setup();
    await send(emp.token, worker.id, 'm1');
    const first = await thread(worker.token, emp.id).expect(200);
    expect(texts(first)).toEqual(['m1']);

    const none = await thread(worker.token, emp.id, `?after=${first.body.cursor}`).expect(200);
    expect(none.body.items).toEqual([]);
    expect(none.body.cursor).toBe(first.body.cursor);

    await send(emp.token, worker.id, 'm2');
    await send(emp.token, worker.id, 'm3');
    const fresh = await thread(worker.token, emp.id, `?after=${first.body.cursor}`).expect(200);
    expect(texts(fresh)).toEqual(['m2', 'm3']);

    const limited = await thread(worker.token, emp.id, `?after=${first.body.cursor}&limit=1`).expect(200);
    expect(texts(limited)).toEqual(['m2']);
    expect(limited.body.hasMore).toBe(true);
  });

  it('rejects before and after together, and bad cursors', async () => {
    const { emp, worker } = await setup();
    await thread(emp.token, worker.id, '?before=5&after=1').expect(400);
    await thread(emp.token, worker.id, '?after=abc').expect(400);
  });

  it('returns 404 for a peer of the wrong kind or who does not exist', async () => {
    const { emp, worker } = await setup();
    const other = await registerUser(employerBody('0722555444'));
    await thread(emp.token, other.user.id).expect(404);
    await thread(worker.token, worker.id).expect(404);
    await thread(emp.token, 'nobody').expect(404);
  });

  it('never shows other people\'s conversations', async () => {
    const { emp, worker } = await setup();
    const other = await registerUser(employerBody('0722555444'));
    await send(emp.token, worker.id, 'secret for Jean');
    await send(other.accessToken, worker.id, 'other employer message');

    expect(texts(await thread(other.accessToken, worker.id))).toEqual(['other employer message']);
    expect(texts(await thread(emp.token, worker.id))).toEqual(['secret for Jean']);
  });
});

describe('unread badge (FR 6.3)', () => {
  it('counts unread messages and clears them when the thread is opened', async () => {
    const { emp, worker } = await setup();
    await send(emp.token, worker.id, 'a');
    await send(emp.token, worker.id, 'b');
    await send(worker.token, emp.id, 'c');

    expect(await unread(worker.token)).toBe(2);
    expect(await unread(emp.token)).toBe(1);

    const opened = await thread(worker.token, emp.id).expect(200);
    expect(opened.body.items.filter((m: { fromMe: boolean; readAt: string | null }) => !m.fromMe).every((m: { readAt: string | null }) => m.readAt)).toBe(true);
    expect(await unread(worker.token)).toBe(0);
    expect(await unread(emp.token)).toBe(1); // opening someone else's view doesn't read my messages
  });

  it('only marks what was actually returned as read', async () => {
    const { emp, worker } = await setup();
    for (const t of ['a', 'b', 'c']) await send(emp.token, worker.id, t);
    await thread(worker.token, emp.id, '?limit=1').expect(200); // loads just 'c'
    expect(await unread(worker.token)).toBe(2);
  });

  it('keeps counts per conversation separate', async () => {
    const { emp, worker } = await setup();
    const other = await registerUser(employerBody('0722555444'));
    await send(emp.token, worker.id, 'from emp');
    await send(other.accessToken, worker.id, 'from other');
    await thread(worker.token, emp.id);
    expect(await unread(worker.token)).toBe(1);
  });
});

describe('conversation list', () => {
  it('lists one entry per person, newest first, with last message and unread count', async () => {
    const emp = await registerUser(employerBody());
    const w1 = await createVisibleWorker({ name: 'Alpha' });
    const w2 = await createVisibleWorker({ name: 'Beta' });
    const w3 = await createVisibleWorker({ name: 'Gamma' });

    await send(emp.accessToken, w1.id, 'to alpha 1');
    await send(emp.accessToken, w2.id, 'to beta 1');
    await send(w1.token, emp.user.id, 'alpha replies');
    await send(emp.accessToken, w3.id, 'to gamma 1');
    await send(w2.token, emp.user.id, 'beta replies');

    const res = await request(app).get('/api/messages').set(auth(emp.accessToken)).expect(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.map((c: { peer: { name: string } }) => c.peer.name)).toEqual(['Beta', 'Gamma', 'Alpha']);
    expect(res.body.items[0]).toMatchObject({ lastMessage: { content: 'beta replies', fromMe: false }, unreadCount: 1 });
    expect(res.body.items[1]).toMatchObject({ lastMessage: { content: 'to gamma 1', fromMe: true }, unreadCount: 0 });

    const page = await request(app).get('/api/messages?limit=1&offset=1').set(auth(emp.accessToken)).expect(200);
    expect(page.body.items.map((c: { peer: { name: string } }) => c.peer.name)).toEqual(['Gamma']);
    expect(page.body.total).toBe(3);
  });

  it('shows workers the employer\'s company and never a phone number', async () => {
    const { emp, worker } = await setup();
    await send(emp.token, worker.id, 'Hi');
    const res = await request(app).get('/api/messages').set(auth(worker.token)).expect(200);
    expect(res.body.items[0].peer.companyName).toBe('BrightHomes Ltd');
    expect(JSON.stringify(res.body)).not.toContain('+250'); // ids are UUIDs, so only a real phone number could contain this
  });

  it('is empty for someone with no messages', async () => {
    const { emp } = await setup();
    const res = await request(app).get('/api/messages').set(auth(emp.token)).expect(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });
});
