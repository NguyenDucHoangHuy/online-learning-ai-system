import { Request, Response } from "express";

import * as classesService from "./classes.service";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";

import { asyncHandler } from "../../common/utils/async-handler.util";

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.user!.id;

  const result = await classesService.createClass(teacherId, req.body);

  return sendResponse(res, HTTP_STATUS.CREATED, MESSAGES.CLASS_CREATED, result);
});

export const getMyClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await classesService.getMyClasses(teacherId);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  },
);

export const getClassById = asyncHandler(
  async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await classesService.getClassById(
      req.params.classId,
      teacherId,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  },
);

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.user!.id;

  const result = await classesService.updateClass(
    req.params.classId,
    teacherId,
    req.body,
  );

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.CLASS_UPDATED, result);
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.user!.id;

  await classesService.deleteClass(req.params.classId, teacherId);

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.CLASS_DELETED);
});
