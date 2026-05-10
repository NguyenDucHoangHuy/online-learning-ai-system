# Tạo môi trường ảo tên là .venv
python -m venv .venv

# Kích hoạt môi trường ảo
.venv\Scripts\activate

# Trong file requirement.txt đã để sẵn thư viện chỉ cần chạy lệnh để tải về
pip install -r requirements.txt

# Sau khi tải và chuẩn bị môi trường xong chạy lệnh để khởi tạo server
uvicorn main:app --reload

# Qua cd frontend chạy file TeacherRoomPage để test chức năng