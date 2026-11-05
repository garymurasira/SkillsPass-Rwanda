import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { visibleWorkerWhere } from '../profile/visibility';

export type Actor = { userId: string; role: Extract<Role, 'EMPLOYER' | 'WORKER'> };

const messageView = (m: { id: string; seq: number; content: string; sentAt: Date; readAt: Date | null; senderId: string }, me: string) => ({
  id: m.id,
  seq: m.seq,
  content: m.content,
  sentAt: m.sentAt,
  fromMe: m.senderId === me,
  readAt: m.readAt,
});

// FR 6.1 + BR 2.
//  - Employers may start or continue a conversation only with a worker who appears in search.
//  - Workers may only reply in a conversation an employer has already started (no cold messages).
export async function sendMessage(sender: Actor, recipientId: string, content: string) {
  if (recipientId === sender.userId) throw new AppError(400, 'CANNOT_MESSAGE_SELF');

  if (sender.role === 'EMPLOYER') {
    const worker = await prisma.worker.findFirst({ where: { userId: recipientId, ...visibleWorkerWhere }, select: { userId: true } });
    if (!worker) throw new AppError(404, 'RECIPIENT_NOT_FOUND');
  } else {
    const started = await prisma.message.findFirst({
      where: { senderId: recipientId, receiverId: sender.userId, sender: { role: 'EMPLOYER' } },
      select: { id: true },
    });
    if (!started) throw new AppError(403, 'REPLY_ONLY');
  }

  const m = await prisma.message.create({ data: { senderId: sender.userId, receiverId: recipientId, content } });
  return messageView(m, sender.userId);
}

// FR 6.2: the history between two users. Opening it marks the received messages as read (FR 6.3).
export async function getThread(
  me: Actor,
  peerId: string,
  q: { before?: number; after?: number; limit: number },
) {
  const peer = await prisma.user.findFirst({
    where: { id: peerId, role: me.role === 'EMPLOYER' ? 'WORKER' : 'EMPLOYER' },
    include: { worker: { select: { photoUrl: true } }, employer: { select: { companyName: true } } },
  });
  if (!peer) throw new AppError(404, 'PEER_NOT_FOUND');

  // Only messages between exactly these two users, so nobody can read anyone else's conversation.
  const pair: Prisma.MessageWhereInput = {
    OR: [
      { senderId: me.userId, receiverId: peerId },
      { senderId: peerId, receiverId: me.userId },
    ],
  };

  let rows;
  let hasMore: boolean;
  if (q.after !== undefined) {
    rows = await prisma.message.findMany({ where: { ...pair, seq: { gt: q.after } }, orderBy: { seq: 'asc' }, take: q.limit + 1 });
    hasMore = rows.length > q.limit;
    rows = rows.slice(0, q.limit);
  } else {
    const older = await prisma.message.findMany({
      where: { ...pair, ...(q.before !== undefined ? { seq: { lt: q.before } } : {}) },
      orderBy: { seq: 'desc' },
      take: q.limit + 1,
    });
    hasMore = older.length > q.limit;
    rows = older.slice(0, q.limit).reverse(); // oldest -> newest
  }

  const unreadIds = rows.filter((m) => m.receiverId === me.userId && m.readAt === null).map((m) => m.id);
  const readAt = new Date();
  if (unreadIds.length) {
    await prisma.message.updateMany({ where: { id: { in: unreadIds }, readAt: null }, data: { readAt } });
  }

  const items = rows.map((m) => messageView(unreadIds.includes(m.id) ? { ...m, readAt } : m, me.userId));
  return {
    peer: { id: peer.id, name: peer.name, photoUrl: peer.worker?.photoUrl ?? null, companyName: peer.employer?.companyName ?? null },
    items,
    hasMore, // more messages in the direction of paging
    cursor: items.length ? items[items.length - 1].seq : (q.after ?? null), // pass as `after` to poll
  };
}

// FR 6.3: the number shown on the unread badge.
export async function unreadCount(userId: string) {
  return { unread: await prisma.message.count({ where: { receiverId: userId, readAt: null } }) };
}
