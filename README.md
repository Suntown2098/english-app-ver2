# english-app-ver2

## Hướng dẫn chạy project local

### 1. Clone repository từ GitHub

```bash
git clone <REPO_URL>
cd english-app-ver2
```

### 2. Cài dependencies cho từng folder

#### a. Cài đặt cho backend (Python)

```bash
cd backend
# Tạo virtual environment
python3 -m venv .venv

# Kích hoạt virtualenv:
# - Trên Ubuntu/macOS:
source .venv/bin/activate
# - Trên Windows (cmd):
.venv\Scripts\activate
# - Trên Windows (PowerShell):
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```


#### b. Cài đặt cho frontend (Next.js)

```bash
cd ../frontend
npm install
```

### 3. Chạy đồng thời cả backend và frontend

Quay lại thư mục gốc của project:

```bash
cd ../frontend
npm run dev:all
```

- Lệnh này sẽ chạy **frontend** ở chế độ dev (Next.js) và **backend** (Flask/FastAPI/...) cùng lúc.
- Nếu muốn chạy riêng từng phần:
  - Backend: `cd backend && source .venv/bin/activate && python app.py`
  - Frontend: `cd frontend && npm run dev`

### 4. Truy cập ứng dụng
- Frontend: Mặc định tại [http://localhost:3000](http://localhost:3000)
- Backend: Mặc định tại [http://localhost:5000](http://localhost:5000) (hoặc port backend config)

---

## Một số lưu ý khác
- Đảm bảo đã cài **Node.js** (>=18) và **Python** (>=3.10) trên máy.
- Nếu gặp lỗi về package, hãy kiểm tra lại version hoặc xóa `node_modules`/`.venv` rồi cài lại.

---
