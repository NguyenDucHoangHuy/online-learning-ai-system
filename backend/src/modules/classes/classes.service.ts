import { prisma } from "../../prisma/client";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { AppError } from "../../common/middleware/error.middleware";

import { CreateClassDto, UpdateClassDto } from "./classes.dto";

const findOwnedClass = async (classId: string, teacherId: string) => {
  const foundClass = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId,
    },
  });

  if (!foundClass) {
    throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return foundClass;
};

export const createClass = async (teacherId: string, data: CreateClassDto) => {
  const newClass = await prisma.class.create({
    data: {
      name: data.name,
      description: data.description,
      teacherId,
    },

    select: {
      id: true,
      name: true,
      description: true,
      teacherId: true,
      createdAt: true,
    },
  });

  return newClass;
};

export const getMyClasses = async (teacherId: string) => {
  const classes = await prisma.class.findMany({
    where: {
      teacherId,
    },

    include: {
      _count: {
        select: {
          sessions: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return classes;
};

export const getClassById = async (classId: string, teacherId: string) => {
  // Thay vì gọi findOwnedClass rồi gọi lại findUnique, ta lấy trực tiếp luôn:
  const foundClass = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId, // Ép quyền sở hữu ngay trong lệnh truy vấn
    },
    include: {
      sessions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });

  if (!foundClass) {
    throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return foundClass;
};

export const updateClass = async (
  classId: string,
  teacherId: string,
  data: UpdateClassDto,
) => {
  await findOwnedClass(classId, teacherId);

  const updatedClass = await prisma.class.update({
    where: {
      id: classId,
    },

    data: {
      ...data,
    },

    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
    },
  });

  return updatedClass;
};

export const deleteClass = async (classId: string, teacherId: string) => {
  await findOwnedClass(classId, teacherId);

  await prisma.class.delete({
    where: {
      id: classId,
    },
  });
};
