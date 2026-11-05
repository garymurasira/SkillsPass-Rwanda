import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';

// FR 6.2: the conversation list, most recent first, with the last message and unread count per person.
export async function listConversations(me: string, limit: number, offset: number) {
  const latest = await prisma.$queryRaw<{ peerId: string; content: string; sentAt: Date; senderId: string }[]>(Prisma.sql`
    SELECT * FROM (
      SELECT DISTINCT ON (peer) peer AS "peerId", content, "sentAt", "senderId", seq
      FROM (
        SELECT CASE WHEN "senderId" = ${me} THEN "receiverId" ELSE "senderId" END AS peer,
               content, "sentAt", "senderId", seq
        FROM "Message"
        WHERE "senderId" = ${me} OR "receiverId" = ${me}
      ) m
      ORDER BY peer, seq DESC
    ) last
    ORDER BY seq DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(DISTINCT CASE WHEN "senderId" = ${me} THEN "receiverId" ELSE "senderId" END) AS count
    FROM "Message" WHERE "senderId" = ${me} OR "receiverId" = ${me}
  `);

  const peerIds = latest.map((l) => l.peerId);
  const [peers, unread] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: peerIds } },
      include: { worker: { select: { photoUrl: true } }, employer: { select: { companyName: true } } },
    }),
    prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: me, readAt: null, senderId: { in: peerIds } },
      _count: { _all: true },
    }),
  ]);
  const peerById = new Map(peers.map((p) => [p.id, p]));
  const unreadBy = new Map(unread.map((u) => [u.senderId, u._count._all]));

  return {
    items: latest.map((l) => {
      const p = peerById.get(l.peerId)!;
      return {
        peer: { id: p.id, name: p.name, photoUrl: p.worker?.photoUrl ?? null, companyName: p.employer?.companyName ?? null },
        lastMessage: { content: l.content, sentAt: l.sentAt, fromMe: l.senderId === me },
        unreadCount: unreadBy.get(l.peerId) ?? 0,
      };
    }),
    total: Number(count),
    limit,
    offset,
  };
}
