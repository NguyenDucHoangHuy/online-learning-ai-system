import bcrypt from "bcrypt";
import {
  PrismaClient,
  Role,
  SessionStatus,
  JoinStatus,
  EmotionType,
  AttentionLevel,
} from "@prisma/client";

const prisma = new PrismaClient();

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

async function createManyInChunks<T>(
  rows: T[],
  createMany: (data: T[]) => Promise<unknown>,
  chunkSize = 1000,
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await createMany(rows.slice(i, i + chunkSize));
  }
}

async function main() {
  console.log("🌱 Seeding large dataset...");

  const passwordHash = await bcrypt.hash("123456", 10);

  // ================= CLEAN =================

  await prisma.emotionLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.class.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: "@test.com",
      },
    },
  });

  console.log("🧹 Database cleaned");

  // ================= REAL USERS =================

  const student = await prisma.user.upsert({
    where: {
      email: "tholq.23ite@vku.udn.vn",
    },
    update: {},
    create: {
      fullName: "Le Quang Tho",
      email: "tholq.23ite@vku.udn.vn",
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const teacher = await prisma.user.upsert({
    where: {
      email: "lebaonguyen2572005@gmail.com",
    },
    update: {},
    create: {
      fullName: "Lê Bảo Nguyên",
      email: "lebaonguyen2572005@gmail.com",
      passwordHash,
      role: Role.TEACHER,
    },
  });

  console.log("👤 Real users ready");

  // ================= FAKE STUDENTS =================

  const fakeStudents = [];

  for (let i = 1; i <= 50; i++) {
    const s = await prisma.user.create({
      data: {
        fullName: `Student ${i}`,
        email: `student${i}@test.com`,
        passwordHash,
        role: Role.STUDENT,
      },
    });

    fakeStudents.push(s);
  }

  const allStudents = [student, ...fakeStudents];

  console.log(`👨‍🎓 Created ${allStudents.length} students`);

  // ================= CLASSES =================

  const classNames = [
    "NodeJS Advanced",
    "React Mastery",
    "Database Design",
    "System Analysis",
    "Software Architecture",
  ];

  const classes = [];

  for (const name of classNames) {
    const c = await prisma.class.create({
      data: {
        name,
        description: `${name} Course`,
        teacherId: teacher.id,
      },
    });

    classes.push(c);
  }

  console.log(`🏫 Created ${classes.length} classes`);

  // ================= SESSIONS =================

  const sessionTitles = [
    "Prisma Deep Dive",
    "REST API Design",
    "React Query",
    "WebRTC Realtime",
    "Socket.IO",
    "Database Optimization",
    "Clean Architecture",
    "JWT Security",
    "Redis Caching",
    "Docker Deployment",
  ];

  const sessions = [];

  for (let i = 1; i <= 20; i++) {
    const classItem = rand(classes);
    const startedAt = randomDate(
      new Date(Date.now() - 30 * 86400000),
      new Date(Date.now() - 2 * 60 * 60 * 1000),
    );
    const status = rand([
      SessionStatus.ACTIVE,
      SessionStatus.ENDED,
      SessionStatus.ENDED,
      SessionStatus.ENDED,
    ]);

    const session = await prisma.classSession.create({
      data: {
        classId: classItem.id,
        title: rand(sessionTitles) + ` #${i}`,
        sessionCode: `SESSION-${i}-${Date.now()}`,
        status,
        requireApproval: Math.random() > 0.5,
        startedAt,
        endedAt:
          status === SessionStatus.ENDED
            ? addMinutes(startedAt, randomInt(45, 90))
            : null,
      },
    });

    sessions.push(session);
  }

  console.log(`📚 Created ${sessions.length} sessions`);

  // ================= PARTICIPANTS =================

  const participants = [];

  for (const session of sessions) {
    const selectedStudents = shuffle(allStudents).slice(0, randomInt(15, 40));
    const sessionStart = session.startedAt ?? session.createdAt;
    const sessionEnd = session.endedAt ?? addMinutes(sessionStart, 90);

    for (const s of selectedStudents) {
      const joinedAt = addMinutes(sessionStart, randomInt(0, 10));

      const participant = await prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          studentId: s.id,
          joinStatus: JoinStatus.APPROVED,
          attemptNumber: randomInt(1, 3),
          joinedAt,
          leftAt:
            session.status === SessionStatus.ENDED
              ? randomDate(addMinutes(joinedAt, 30), sessionEnd)
              : null,
        },
      });

      participants.push(participant);
    }
  }

  console.log(`👥 Created ${participants.length} participants`);

  // ================= CHAT =================

  const messages = [
    "Em chưa hiểu đoạn này",
    "Thầy giải thích lại giúp em",
    "API này dùng để làm gì ạ",
    "Prisma relation khó quá",
    "Em làm được rồi",
    "Cảm ơn thầy",
    "Realtime chạy ổn chưa",
    "Socket bị disconnect",
    "Deploy lên VPS như nào",
    "Redis có bắt buộc không",
    "JWT hết hạn xử lý sao",
    "Có ví dụ thực tế không ạ",
  ];

  let chatCount = 0;

  for (const session of sessions) {
    const totalMessages = randomInt(50, 150);
    const sessionStart = session.startedAt ?? session.createdAt;
    const sessionEnd = session.endedAt ?? addMinutes(sessionStart, 90);

    for (let i = 0; i < totalMessages; i++) {
      const sender = Math.random() > 0.15 ? rand(allStudents) : teacher;

      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          userId: sender.id,
          message: rand(messages),
          sentAt: randomDate(sessionStart, sessionEnd),
        },
      });

      chatCount++;
    }
  }

  console.log(`💬 Created ${chatCount} chat messages`);

  // ================= EMOTION LOGS =================

  const emotions = Object.values(EmotionType);
  const attentions = Object.values(AttentionLevel);

  let emotionCount = 0;
  const emotionRows = [];

  for (const participant of participants) {
    const totalLogs = randomInt(50, 120);
    const session = sessions.find((item) => item.id === participant.sessionId);
    const trackingStart = participant.joinedAt ?? session?.startedAt ?? new Date();
    const trackingEnd =
      participant.leftAt ??
      session?.endedAt ??
      addMinutes(trackingStart, randomInt(45, 90));

    for (let i = 0; i < totalLogs; i++) {
      emotionRows.push({
        participantId: participant.id,
        emotion: rand(emotions),
        attentionLevel: rand(attentions),
        confidence: Number(Math.random().toFixed(2)),
        recordedAt: randomDate(trackingStart, trackingEnd),
      });

      emotionCount++;
    }
  }

  await createManyInChunks(emotionRows, (data) =>
    prisma.emotionLog.createMany({
      data,
    }),
  );

  console.log(`📊 Created ${emotionCount} emotion logs`);

  console.log("🎉 Seed completed successfully");
  console.log("--------------------------------");
  console.log(`Students: ${allStudents.length}`);
  console.log(`Classes: ${classes.length}`);
  console.log(`Sessions: ${sessions.length}`);
  console.log(`Participants: ${participants.length}`);
  console.log(`Messages: ${chatCount}`);
  console.log(`Emotion Logs: ${emotionCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
