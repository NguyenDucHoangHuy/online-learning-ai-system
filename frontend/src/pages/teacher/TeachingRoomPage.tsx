// // src/pages/teacher/TeachingRoomPage.tsx
// import { useState } from "react";
// import {
//   Mic,
//   Video,
//   Monitor,
//   Hand,
//   BarChart2,
//   MessageSquare,
//   MoreVertical,
//   Users, // Thêm icon Users
// } from "lucide-react";
// import VideoTile from "../../components/ui/VideoTile";
// import ParticipantList from "../../components/ui/ParticipantList";

// // Data mẫu để test UI
// const mockStudents = [
//   { id: 1, name: "Quốc Anh", status: "focused" as const, isMuted: true },
//   { id: 2, name: "Công Đức", status: "normal" as const, isMuted: true },
//   { id: 3, name: "Nguyễn Văn A", status: "distracted" as const, isMuted: true },
//   { id: 4, name: "Trần Thị B", status: "focused" as const, isMuted: true },
//   { id: 5, name: "Lê Văn C", status: "normal" as const, isMuted: true },
// ];

// export default function TeachingRoomPage() {
//   // State quản lý việc hiển thị Sidebar
//   const [showParticipants, setShowParticipants] = useState(false);

//   return (
//     <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
//       {/* KHU VỰC CHÍNH: Video Grid & Controls */}
//       <div
//         className={`flex flex-col h-full transition-all duration-300 ease-in-out ${
//           showParticipants ? "w-[calc(100%-20rem)]" : "w-full"
//         }`}
//       >
//         {/* Top Bar */}
//         <div className="p-4 flex justify-between items-start">
//           <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-lg">
//             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
//             <div>
//               <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">
//                 Recording Live
//               </p>
//               <h2 className="font-semibold text-sm text-slate-200">
//                 Đồ án Chuyên ngành 1 - Nhóm 1
//               </h2>
//             </div>
//           </div>

//           <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-right shadow-lg flex items-center gap-4">
//             <div>
//               <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">
//                 Độ tập trung lớp
//               </p>
//               <p className="text-emerald-400 font-bold text-sm">85% (Tốt)</p>
//             </div>
//           </div>
//         </div>

//         {/* Main Video Grid */}
//         <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
//           {/* Giáo viên luôn ở đầu */}
//           <VideoTile name="Hoàng Huy" role="teacher" isMuted={false} />

//           {/* Map danh sách sinh viên */}
//           {mockStudents.map((student) => (
//             <VideoTile
//               key={student.id}
//               name={student.name}
//               attentionStatus={student.status}
//               isMuted={student.isMuted}
//             />
//           ))}
//         </div>

//         {/* Bottom Controls */}
//         <div className="p-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50">
//           <div className="text-xs text-slate-500 font-mono tracking-wider w-1/3">
//             {new Date().toLocaleTimeString("vi-VN", {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}{" "}
//             | EDUSENSE
//           </div>

//           <div className="flex items-center gap-3 w-1/3 justify-center">
//             <button className="p-3.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
//               <Mic size={20} />
//             </button>
//             <button className="p-3.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
//               <Video size={20} />
//             </button>
//             <button className="p-3.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
//               <Monitor size={20} />
//             </button>
//             <button className="p-3.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
//               <Hand size={20} />
//             </button>
//             <button className="px-8 py-3.5 bg-rose-600 text-white rounded-full font-bold text-xs tracking-wider hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/20 ml-2">
//               KẾT THÚC
//             </button>
//           </div>

//           <div className="flex items-center gap-3 w-1/3 justify-end">
//             <button className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors">
//               <BarChart2 size={16} className="text-blue-400" /> AI DASHBOARD
//             </button>

//             {/* Nút bật tắt Sidebar Participant */}
//             <button
//               onClick={() => setShowParticipants(!showParticipants)}
//               className={`p-3 rounded-xl transition-colors ${
//                 showParticipants
//                   ? "bg-blue-600 text-white"
//                   : "bg-slate-800 text-slate-300 hover:bg-slate-700"
//               }`}
//             >
//               <Users size={18} />
//             </button>

//             <button className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
//               <MessageSquare size={18} />
//             </button>
//             <button className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
//               <MoreVertical size={18} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* KHU VỰC SIDEBAR: Danh sách người tham gia */}
//       {showParticipants && (
//         <div className="w-80 h-full border-l border-slate-800 bg-slate-900 z-10 flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
//           <ParticipantList
//             participants={[
//               // Thêm giáo viên
//               {
//                 id: "t1",
//                 name: "Hoàng Huy",
//                 role: "teacher",
//                 isMuted: false,
//                 isVideoOff: false,
//               },
//               // Chuyển đổi mockStudents sang định dạng của ParticipantList
//               ...mockStudents.map((s) => ({
//                 id: String(s.id),
//                 name: s.name,
//                 role: "student" as const,
//                 isMuted: s.isMuted,
//                 isVideoOff: false,
//               })),
//             ]}
//             currentUserRole="teacher"
//             onClose={() => setShowParticipants(false)}
//           />
//         </div>
//       )}
//     </div>
//   );
// }





// src/pages/teacher/TeachingRoomPage.tsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Mic,
  Video,
  Monitor,
  Hand,
  BarChart2,
  MessageSquare,
  MoreVertical,
  Users,
} from "lucide-react";

import VideoTile from "../../components/ui/VideoTile";
import ParticipantList from "../../components/ui/ParticipantList";

const mockStudents = [
  { id: 1, name: "Quốc Anh", status: "focused" as const, isMuted: true },
  { id: 2, name: "Công Đức", status: "normal" as const, isMuted: true },
  { id: 3, name: "Nguyễn Văn A", status: "distracted" as const, isMuted: true },
  { id: 4, name: "Trần Thị B", status: "focused" as const, isMuted: true },
];

export default function TeachingRoomPage() {
  const [showParticipants, setShowParticipants] = useState(false);

  // trạng thái AI realtime
  const [emotionStatus, setEmotionStatus] = useState<
    "focused" | "normal" | "distracted"
  >("normal");

  const [emotionName, setEmotionName] = useState("neutral");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // mở webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.log("Camera error:", error);
      }
    }

    startCamera();
  }, []);

  // gửi frame lên Flask AI
  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx?.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/detect-emotion",
        {
          image: imageData,
        }
      );

      console.log(response.data);

      setEmotionStatus(response.data.status);
      setEmotionName(response.data.emotion);
    } catch (error) {
      console.log("AI error:", error);
    }
  };

  // detect mỗi 5 giây
  useEffect(() => {
    const interval = setInterval(() => {
      captureFrame();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      {/* Main */}
      <div
        className={`flex flex-col h-full transition-all duration-300 ${
          showParticipants ? "w-[calc(100%-20rem)]" : "w-full"
        }`}
      >
        {/* Top bar */}
        <div className="p-4 flex justify-between items-start">
          <div className="bg-slate-900 p-3 rounded-xl">
            <h2>Đồ án Chuyên ngành 1</h2>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl">
            <p>Emotion hiện tại:</p>
            <p className="text-green-400 font-bold">
              {emotionName} → {emotionStatus}
            </p>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* webcam thật */}
          <div className="bg-slate-800 rounded-xl overflow-hidden h-64">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* student test AI */}
          <VideoTile
            name="AI Student"
            attentionStatus={emotionStatus}
            isMuted={false}
          />

          {/* fake students */}
          {mockStudents.map((student) => (
            <VideoTile
              key={student.id}
              name={student.name}
              attentionStatus={student.status}
              isMuted={student.isMuted}
            />
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="p-5 flex justify-center gap-3 border-t border-slate-800">
          <button className="p-3 bg-slate-800 rounded-full">
            <Mic size={20} />
          </button>

          <button className="p-3 bg-slate-800 rounded-full">
            <Video size={20} />
          </button>

          <button className="p-3 bg-slate-800 rounded-full">
            <Monitor size={20} />
          </button>

          <button className="p-3 bg-slate-800 rounded-full">
            <Hand size={20} />
          </button>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-3 bg-blue-600 rounded-full"
          >
            <Users size={20} />
          </button>

          <button className="p-3 bg-slate-800 rounded-full">
            <MessageSquare size={20} />
          </button>

          <button className="p-3 bg-slate-800 rounded-full">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* sidebar */}
      {showParticipants && (
        <div className="w-80 h-full border-l border-slate-800 bg-slate-900">
          <ParticipantList
            participants={[
              {
                id: "t1",
                name: "Hoàng Huy",
                role: "teacher",
                isMuted: false,
                isVideoOff: false,
              },
            ]}
            currentUserRole="teacher"
            onClose={() => setShowParticipants(false)}
          />
        </div>
      )}

      {/* canvas hidden */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}