import { Request, Response } from "express";

import { participantsService } from "./participants.service";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";
import { JoinStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const participantsController = {
  joinSession: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const result = await participantsService.joinSession(
      req.params.sessionId,
      studentId,
    );

    const message =
      result.joinStatus === "PENDING"
        ? MESSAGES.JOIN_REQUEST_SENT
        : MESSAGES.JOIN_SUCCESS;

    return sendResponse(res, HTTP_STATUS.OK, message, result);
  }),

  getParticipants: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const { sessionId } = req.params;

    // Zod đã đảm bảo biến này hoặc là undefined, hoặc là giá trị chuẩn xác của JoinStatus
    const status = req.query.status as JoinStatus | undefined;
    const result = await participantsService.getParticipants(
      req.params.sessionId,
      teacherId,
      status,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANTS_FETCHED,
      result,
    );
  }),

  approveParticipant: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await participantsService.approveParticipant(
      req.params.participantId,
      teacherId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANT_APPROVED,
      result,
    );
  }),

  rejectParticipant: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await participantsService.rejectParticipant(
      req.params.participantId,
      teacherId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANT_REJECTED,
      result,
    );
  }),

  leaveSession: asyncHandler(async (req: Request, res: Response) => {
    const { participantId, sessionId } = req.params;
    const studentId = req.user!.id; // Bốc chuẩn xác ID học sinh từ token an toàn toàn cục

    let targetParticipantId = participantId;
    let originStatus: string | undefined = undefined;

    // 🧠 TRA CỨU HÀNG CHỜ KIÊN CỐ: Giải phóng rào chắn leftAt để quét trúng bản ghi PENDING
    if (sessionId && !targetParticipantId) {
      const activeRecord = await prisma.sessionParticipant.findFirst({
        where: {
          sessionId,
          studentId,
          joinStatus: {
            in: [JoinStatus.APPROVED, JoinStatus.PENDING],
          },
        },
        orderBy: {
          id: "desc", // Luôn luôn bốc yêu cầu mới nhất vừa sinh ra ở lượt nhập mã này
        },
      });

      if (activeRecord) {
        targetParticipantId = activeRecord.id;
        originStatus = activeRecord.joinStatus; // Ghi nhớ lại trạng thái gốc (PENDING hoặc APPROVED)
      }
    }

    if (!targetParticipantId) {
      return sendResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Không tìm thấy phiên làm việc hoặc yêu cầu xếp hàng hợp lệ để thực hiện tác vụ.",
      );
    }

    // Đẩy xuống tầng Service bồ đã vá Guard State cho phép APPROVED và PENDING đi qua
    const result = await participantsService.leaveSession(
      targetParticipantId,
      studentId,
    );

    // 🎯 THUẬT TOÁN PHÂN NHÁNH MESSAGE NGỮ CẢNH:
    // Nếu trạng thái ban đầu là PENDING -> Trả về thông báo Hủy, nếu là APPROVED -> Báo Rời lớp
    const successMessage =
      originStatus === JoinStatus.PENDING
        ? "Hủy yêu cầu tham gia lớp học thành công."
        : "Rời khỏi phòng học trực tuyến thành công.";

    return sendResponse(res, HTTP_STATUS.OK, successMessage, result);
  }),

  approveAllParticipants: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const { sessionId } = req.params;

    const result = await participantsService.approveAllParticipants(
      sessionId,
      teacherId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANT_APPROVED,
      result,
    );
  }),
};
