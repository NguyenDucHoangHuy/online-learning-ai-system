import { prisma } from "../../prisma/client";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { AppError } from "../../common/middleware/error.middleware";

import { CreateClassDto, UpdateClassDto } from "./classes.dto";

export const classesService = {
  createClass: async (teacherId: string, data: CreateClassDto) => {
    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        description: data.description,
        teacherId,
      },
    });

    return newClass;
  },

  getMyClasses: async (teacherId: string) => {
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
  },

  getClassById: async (classId: string, teacherId: string) => {
    const foundClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },

      include: {
        sessions: true,
      },
    });

    if (!foundClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return foundClass;
  },

  updateClass: async (
    classId: string,
    teacherId: string,
    data: UpdateClassDto,
  ) => {
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const updatedClass = await prisma.class.update({
      where: {
        id: classId,
      },

      data,
    });

    return updatedClass;
  },

  deleteClass: async (classId: string, teacherId: string) => {
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.class.delete({
      where: {
        id: classId,
      },
    });
  },
};
