import { Request, Response } from "express";
import { participantsService } from "./participants.service";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";

export const participantsController = {
  joinSession: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const result = await participantsService.joinByCode(studentId, req.body);
    
    const message = result.joinStatus === "PENDING" 
      ? "Yêu cầu tham gia đã được gửi, vui lòng chờ giảng viên phê duyệt." 
      : "Tham gia buổi học thành công.";
      
    return sendResponse(res, HTTP_STATUS.OK, message, result);
  }),

  getPending: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const result = await participantsService.getPendingParticipants(req.params.sessionId, teacherId);
    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const result = await participantsService.updateStatus(req.params.participantId, teacherId, req.body);
    return sendResponse(res, HTTP_STATUS.OK, `Trạng thái: ${req.body.status}`, result);
  }),
};