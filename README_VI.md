# AI Town - Hướng Dẫn Triển Khai trên Ubuntu 24 🏠💻💌

Hướng dẫn chi tiết để triển khai dự án AI Town trên máy chủ Ubuntu 24 với IP `10.0.12.81` và truy cập từ laptop của bạn.

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt Các Công Cụ Cần Thiết](#cài-đặt-các-công-cụ-cần-thiết)
- [Cài Đặt Dự Án](#cài-đặt-dự-án)
- [Cấu Hình IP và Firewall](#cấu-hình-ip-và-firewall)
- [Cài Đặt và Cấu Hình Ollama](#cài-đặt-và-cấu-hình-ollama)
- [Triển Khai với Docker Compose](#triển-khai-với-docker-compose)
- [Truy Cập Từ Laptop](#truy-cập-từ-laptop)
- [Xem Giao Diện và Trạng Thái Các Agent](#xem-giao-diện-và-trạng-thái-các-agent) 👀
- [Hướng Dẫn Sử Dụng Giao Diện Frontend](#hướng-dẫn-sử-dụng-giao-diện-frontend) 🎮
- [Quản Lý Services](#quản-lý-services)
- [Khắc Phục Sự Cố](#khắc-phục-sự-cố)

## 📖 Tổng Quan

AI Town là một thị trấn ảo nơi các nhân vật AI sống, trò chuyện và giao lưu. Dự án này sử dụng:
- **Backend**: Convex (self-hosted hoặc cloud)
- **Frontend**: React + Vite + PixiJS
- **LLM**: Ollama (mặc định) hoặc OpenAI/Together.ai
- **Container**: Docker Compose

### ✨ Xem Agents Đang Chạy

Khi triển khai bằng Docker, bạn có thể xem các agent đang hoạt động qua:
1. **Giao diện game** (`http://10.0.12.81:5173`) - Xem agents di chuyển và trò chuyện trực quan
2. **Convex Dashboard** (`http://10.0.12.81:6791`) - Xem dữ liệu, logs và trạng thái agents trong database

Xem chi tiết tại [phần Xem Giao Diện và Trạng Thái Các Agent](#xem-giao-diện-và-trạng-thái-các-agent).

## 🖥️ Yêu Cầu Hệ Thống

- **Hệ điều hành**: Ubuntu 24.04 LTS
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB+)
- **Ổ cứng**: Tối thiểu 10GB dung lượng trống
- **Mạng**: IP tĩnh `10.0.12.81` đã được cấu hình
- **Quyền truy cập**: Quyền sudo/root

## 🔧 Cài Đặt Các Công Cụ Cần Thiết

### 1. Cập nhật hệ thống

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Cài đặt Git

```bash
sudo apt install git -y
```

### 3. Cài đặt Node.js và npm

Cài đặt Node.js 18 (phiên bản ổn định nhất cho dự án này):

```bash
# Cài đặt NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash

# Tải lại shell configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"

# Cài đặt Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Kiểm tra phiên bản
node --version  # Nên hiển thị v18.x.x
npm --version
```

### 4. Cài đặt Docker và Docker Compose

```bash
# Cài đặt các package cần thiết
sudo apt install -y ca-certificates curl gnupg lsb-release

# Thêm Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Thiết lập repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Thêm user hiện tại vào group docker (không cần sudo khi chạy docker)
sudo usermod -aG docker $USER

# Khởi động Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Kiểm tra cài đặt
docker --version
docker compose version

# Logout và login lại để áp dụng thay đổi group, hoặc chạy:
newgrp docker
```

### 5. Cài đặt Python (nếu cần)

```bash
sudo apt install -y python3 python3-pip
```

## 📦 Cài Đặt Dự Án

### 1. Clone repository

```bash
cd ~
git clone https://github.com/a16z-infra/ai-town.git
cd ai-town
```

### 2. Cài đặt dependencies

```bash
npm install
```

## 🔒 Cấu Hình IP và Firewall

### 1. Kiểm tra IP hiện tại

```bash
ip addr show
# Hoặc
hostname -I
```

Đảm bảo IP `10.0.12.81` đã được cấu hình. Nếu chưa, bạn cần cấu hình network interface.

### 2. Cấu hình Firewall (UFW)

Mở các port cần thiết:

```bash
# Cho phép SSH (nếu chưa mở)
sudo ufw allow 22/tcp

# Mở port cho frontend (5173)
sudo ufw allow 5173/tcp

# Mở port cho backend Convex (3210)
sudo ufw allow 3210/tcp

# Mở port cho HTTP API (3211)
sudo ufw allow 3211/tcp

# Mở port cho dashboard (6791)
sudo ufw allow 6791/tcp

# Mở port cho Ollama (11434)
sudo ufw allow 11434/tcp

# Kích hoạt firewall
sudo ufw enable

# Kiểm tra trạng thái
sudo ufw status
```

### 3. Cấu hình Docker để bind với IP cụ thể (tùy chọn)

Nếu bạn muốn bind Docker services với IP cụ thể `10.0.12.81`, bạn có thể tạo file `.env`:

```bash
cd ~/ai-town
nano .env
```

Thêm nội dung sau:

```env
# IP của máy chủ
URL_BASE=http://10.0.12.81

# Ports
PORT=3210
SITE_PROXY_PORT=3211
DASHBOARD_PORT=6791
OLLAMA_PORT=11434
```

## 🤖 Cài Đặt và Cấu Hình Ollama

### 1. Cài đặt Ollama

```bash
# Tải và cài đặt Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Hoặc cài đặt thủ công
# Tải file cài đặt
wget https://ollama.com/download/ollama-linux-amd64
chmod +x ollama-linux-amd64
sudo mv ollama-linux-amd64 /usr/local/bin/ollama
```

### 2. Tạo systemd service cho Ollama (chạy như service)

```bash
sudo nano /etc/systemd/system/ollama.service
```

Thêm nội dung sau:

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ollama
Group=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Tạo user cho Ollama:

```bash
sudo useradd -r -s /bin/false ollama
sudo mkdir -p /usr/share/ollama
sudo chown ollama:ollama /usr/share/ollama
```

Hoặc đơn giản hơn, chạy Ollama như service:

```bash
# Khởi động Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Kiểm tra trạng thái
sudo systemctl status ollama
```

### 3. Cấu hình Ollama để lắng nghe trên tất cả interfaces

Mặc định Ollama chỉ lắng nghe trên localhost. Để truy cập từ xa, cần cấu hình:

```bash
# Tạo thư mục config
mkdir -p ~/.ollama

# Tạo file config
nano ~/.ollama/config
```

Thêm dòng sau (nếu cần):

```env
OLLAMA_HOST=0.0.0.0:11434
```

Hoặc set biến môi trường:

```bash
# Thêm vào ~/.bashrc hoặc ~/.profile
echo 'export OLLAMA_HOST=0.0.0.0:11434' >> ~/.bashrc
source ~/.bashrc
```

### 4. Tải model LLM

```bash
# Tải model llama3 (model mặc định)
ollama pull llama3

# Tải model embedding (mxbai-embed-large)
ollama pull mxbai-embed-large

# Kiểm tra các model đã tải
ollama list
```

### 5. Kiểm tra Ollama hoạt động

```bash
# Test từ localhost
curl http://localhost:11434

# Test từ IP cụ thể
curl http://10.0.12.81:11434

# Test với model
ollama run llama3 "Hello, how are you?"
```

## 🐳 Triển Khai với Docker Compose

### 1. Tạo file .env.local (nếu chưa có)

```bash
cd ~/ai-town
nano .env.local
```

Thêm nội dung:

```env
# Convex self-hosted configuration
CONVEX_SELF_HOSTED_URL=http://10.0.12.81:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=""

# Ollama configuration
OLLAMA_HOST=http://10.0.12.81:11434

# Frontend URL
VITE_CONVEX_URL=http://10.0.12.81:3210
```

### 2. Cập nhật docker-compose.yml để bind với IP cụ thể

Kiểm tra file `docker-compose.yml` và đảm bảo các biến môi trường đúng. Bạn có thể cần chỉnh sửa:

```bash
nano docker-compose.yml
```

Cập nhật phần environment của frontend:

```yaml
frontend:
  environment:
    - VITE_CONVEX_URL=http://10.0.12.81:3210
```

### 3. Build và khởi động services

```bash
cd ~/ai-town

# Build và khởi động tất cả services
docker compose up --build -d

# Xem logs
docker compose logs -f

# Hoặc xem logs của từng service
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f dashboard
```

### 4. Tạo Admin Key cho Convex

Sau khi backend đã chạy, tạo admin key:

```bash
docker compose exec backend ./generate_admin_key.sh
```

Copy admin key được tạo ra và thêm vào `.env.local`:

```bash
nano .env.local
```

Cập nhật:

```env
CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key-vừa-tạo>"
```

### 5. Cấu hình Convex environment variables

**Lưu ý**: Lệnh `npx convex env set` cần chạy từ thư mục có `package.json`, không thể chạy từ trong container backend.

#### Cách 1: Set qua Convex Dashboard (Khuyến nghị - Dễ nhất)

Đây là cách đơn giản nhất và không gặp lỗi với Node.js version:

1. **Truy cập Dashboard**:
   - Mở trình duyệt và vào: `http://10.0.12.81:6791`
   - Đăng nhập với admin key đã tạo ở bước 4

2. **Thêm Environment Variable**:
   - Tìm phần **"Environment Variables"** hoặc **"Settings"** → **"Environment"**
   - Click **"Add Variable"** hoặc **"New Variable"**
   - Nhập:
     - **Key**: `OLLAMA_HOST`
     - **Value**: `http://host.docker.internal:11434` hoặc `http://10.0.12.81:11434`
   - Click **"Save"** hoặc **"Add"**

3. **Kiểm tra**:
   - Biến môi trường sẽ xuất hiện trong danh sách
   - Backend sẽ tự động reload và sử dụng biến mới

#### Cách 2: Set từ host bằng Convex CLI

**Lưu ý**: Nếu gặp lỗi `ReferenceError: File is not defined`, hãy sử dụng Cách 1 (Dashboard) hoặc Cách 3 (API).

1. **Cài đặt Convex CLI globally** (khuyến nghị):

```bash
# Cài đặt Convex CLI globally
npm install -g convex

# Hoặc cập nhật Node.js lên version 20+ nếu đang dùng v18
# nvm install 20
# nvm use 20
```

2. **Cấu hình Convex CLI để kết nối với self-hosted backend**:

```bash
cd ~/ai-town

# Tạo file .env.local nếu chưa có
nano .env.local
```

Thêm vào file `.env.local`:

```env
CONVEX_SELF_HOSTED_URL=http://10.0.12.81:3210
CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key-đã-tạo-ở-bước-4>"
```

3. **Set OLLAMA_HOST**:

```bash
cd ~/ai-town

# Set OLLAMA_HOST (sử dụng host.docker.internal nếu đã cấu hình extra_hosts)
convex env set OLLAMA_HOST http://host.docker.internal:11434

# HOẶC sử dụng IP trực tiếp (nếu host.docker.internal không hoạt động)
convex env set OLLAMA_HOST http://10.0.12.81:11434
```

#### Cách 3: Set qua API (Nếu CLI không hoạt động)

Nếu cả Dashboard và CLI đều không hoạt động, bạn có thể set environment variable qua API:

```bash
# Lấy admin key từ .env.local hoặc từ bước 4
ADMIN_KEY="<admin-key-của-bạn>"

# Set OLLAMA_HOST qua HTTP API
curl -X POST "http://10.0.12.81:3210/api/environmentVariables" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "OLLAMA_HOST", "value": "http://10.0.12.81:11434"}'
```

**Lưu ý**: Cách này yêu cầu biết chính xác API endpoint của Convex self-hosted. Cách đơn giản nhất vẫn là sử dụng **Dashboard** (Cách 1).

1. Truy cập dashboard: `http://10.0.12.81:6791`
2. Đăng nhập với admin key
3. Vào phần **"Environment Variables"** hoặc **"Settings"**
4. Thêm biến môi trường:
   - Key: `OLLAMA_HOST`
   - Value: `http://host.docker.internal:11434` hoặc `http://10.0.12.81:11434`

#### Kiểm tra kết nối đến Ollama

Sau khi cấu hình, kiểm tra kết nối:

```bash
# 1. Test từ host (đảm bảo Ollama đang chạy)
curl http://localhost:11434
# Nên trả về: "Ollama is running"

# 2. Restart containers để áp dụng extra_hosts
docker compose down
docker compose up -d

# 3. Test từ container (sau khi đã thêm extra_hosts)
docker compose exec backend curl http://host.docker.internal:11434
# Nên trả về: "Ollama is running"

# 4. Nếu host.docker.internal vẫn không hoạt động, lấy IP gateway
GATEWAY_IP=$(docker network inspect ai-town_ai-town-network | grep -oP '"Gateway": "\K[^"]+')
echo "Gateway IP: $GATEWAY_IP"

# 5. Test với IP gateway
docker compose exec backend curl http://$GATEWAY_IP:11434

# 6. Hoặc test với IP host trực tiếp
docker compose exec backend curl http://10.0.12.81:11434
```

**Lưu ý**: Nếu Ollama chỉ lắng nghe trên `127.0.0.1:11434`, bạn cần cấu hình để lắng nghe trên tất cả interfaces (`0.0.0.0:11434`). Xem phần [Cài Đặt và Cấu Hình Ollama](#cài-đặt-và-cấu-hình-ollama).

### 6. Khởi tạo database

**⚠️ Lưu ý quan trọng**: Convex CLI yêu cầu **Node.js v20+**. Nếu bạn đang dùng Node.js v18, bạn có 2 lựa chọn:

#### Cách 1: Chạy init function qua Dashboard (Khuyến nghị - Không cần CLI)

1. **Truy cập Dashboard**:
   - Mở trình duyệt: `http://10.0.12.81:6791`
   - Đăng nhập với admin key

2. **Chạy init function**:
   - Vào tab **"Functions"** hoặc **"Run Function"**
   - Tìm function `init` trong danh sách
   - Click vào function `init`
   - Click **"Run"** hoặc **"Execute"**
   - Function sẽ chạy và khởi tạo database, tạo world, và tạo agents

3. **Kiểm tra kết quả**:
   - Vào tab **"Data"** → **"Tables"**
   - Kiểm tra các bảng `worlds`, `worldStatus`, `maps` đã có dữ liệu chưa

#### Cách 2: Cài Node.js 20+ và dùng CLI

Nếu bạn muốn dùng CLI, cần cài Node.js 20+ trước:

```bash
# Cài đặt nvm (nếu chưa có)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc

# Cài Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Kiểm tra version
node --version  # Nên là v20.x.x

# Cài lại Convex CLI
npm install -g convex

# Khởi tạo database
cd ~/ai-town
convex dev --run init --until-success
```

**Hoặc cài Node.js 20 trực tiếp không dùng nvm**:

```bash
# Cài Node.js 20 từ NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra
node --version  # Nên là v20.x.x

# Cài Convex CLI
npm install -g convex

# Khởi tạo database
cd ~/ai-town
convex dev --run init --until-success
```

#### Cách 3: Chạy init function qua API (Nếu Dashboard không có chức năng Run)

Nếu Dashboard không có chức năng chạy function, bạn có thể gọi qua API:

```bash
# Lấy admin key
ADMIN_KEY="<admin-key-của-bạn>"

# Gọi init function qua HTTP API
curl -X POST "http://10.0.12.81:3210/api/mutation/init" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Lưu ý**: Cách đơn giản nhất là sử dụng **Dashboard** (Cách 1) - không cần cài Node.js 20, không cần CLI.

#### Cách 4: Cài dependencies trước khi dùng CLI

Nếu bạn gặp lỗi "Could not resolve 'convex/server'" khi dùng CLI, cần cài dependencies trước:

```bash
cd ~/ai-town

# Cài dependencies (quan trọng!)
npm install

# Sau đó mới có thể dùng CLI
# (Nhưng vẫn cần Node.js 20+)
```

**Lưu ý**: Ngay cả khi đã cài dependencies, bạn vẫn cần Node.js 20+ để dùng Convex CLI. Cách tốt nhất vẫn là dùng **Dashboard**.

### 7. Các Lệnh Cần Thiết để Start Hệ Thống

Sau khi đã cấu hình xong, đây là **tất cả các lệnh cần chạy** để start hệ thống:

#### Bước 1: Start Docker Services (Nếu chưa chạy)

```bash
cd ~/ai-town
docker compose up -d
```

#### Bước 2: Chạy Init Function (QUAN TRỌNG - Chỉ cần chạy 1 lần)

**Qua Dashboard** (Khuyến nghị):
1. Truy cập: `http://10.0.12.81:6791`
2. Đăng nhập với admin key
3. Vào **Functions** → `init` → **Run**

**Hoặc qua API**:
```bash
ADMIN_KEY="<admin-key>"
curl -X POST "http://10.0.12.81:3210/api/mutation/init" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**⚠️ Nếu gặp cảnh báo "Engine is not active!"**:

Nếu khi chạy init bạn thấy cảnh báo:
```
warn: 'Engine ... is not active! Run "npx convex run testing:resume" to restart it.'
```

Điều này có nghĩa là engine chưa được start. Bạn cần:

1. **Chạy resume trước** (qua Dashboard):
   - Functions → `testing:resume` → **Run**
   - Đợi vài giây

2. **Sau đó chạy init lại**:
   - Functions → `init` → **Run**

**Hoặc thứ tự đúng là**:
1. Chạy `testing:resume` trước để start engine
2. Sau đó chạy `init` để tạo agents

**Lưu ý**: 
- ✅ **Init function sẽ tự động start game engine** - nhưng chỉ khi worldStatus đã là "running"
- ✅ **Nếu worldStatus không phải "running", cần chạy resume trước**
- ✅ **Chỉ cần chạy 1 lần khi lần đầu setup**
- ✅ **Nếu đã chạy init rồi, không cần chạy lại** (trừ khi reset database)

#### Bước 3: Kiểm tra WorldStatus

Trong Dashboard → Data → `worldStatus`:
- Phải có `status` = `"running"`
- Nếu không phải "running", xem bước 4

#### Bước 4: Resume Engine (Nếu worldStatus không phải "running")

**Qua Dashboard**:
- Functions → `testing:resume` → **Run**

**Hoặc qua API**:
```bash
curl -X POST "http://10.0.12.81:3210/api/mutation/testing:resume" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Bước 5: Kick Engine (Nếu engine không chạy)

Nếu sau khi resume mà engine vẫn không chạy:

**Qua Dashboard**:
- Functions → `testing:kick` → **Run**

**Hoặc qua API**:
```bash
curl -X POST "http://10.0.12.81:3210/api/mutation/testing:kick" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Tóm Tắt: Các Lệnh Start/Stop/Resume

| Lệnh | Mô tả | Khi nào dùng |
|------|-------|--------------|
| `init` | Khởi tạo database, tạo world, tạo agents | Chỉ 1 lần khi setup lần đầu |
| `testing:resume` | Resume engine nếu bị dừng | Khi worldStatus là "inactive" hoặc "stoppedByDeveloper" |
| `testing:kick` | Khởi động lại engine | Khi engine không chạy hoặc bị treo |
| `testing:stop` | Dừng engine | Khi muốn tạm dừng simulation |
| `testing:wipeAllTables` | Xóa toàn bộ dữ liệu | Khi muốn reset hoàn toàn |

**Lưu ý quan trọng**:
- ✅ **Sau khi chạy init, game engine sẽ tự động start** - không cần chạy lệnh start riêng
- ✅ **Nếu worldStatus đã là "running", engine đang chạy** - không cần làm gì thêm
- ✅ **Chỉ cần chạy resume/kick nếu worldStatus không phải "running"**

### 8. Checklist: Đảm Bảo Game Hoạt Động

Trước khi truy cập giao diện game, đảm bảo đã hoàn thành các bước sau:

- [ ] ✅ **Docker containers đang chạy**: `docker compose ps` (phải thấy frontend, backend, dashboard đều "Up")
- [ ] ✅ **Ollama đang chạy**: `curl http://localhost:11434` (phải trả về "Ollama is running")
- [ ] ✅ **Admin key đã được tạo**: Đã chạy `docker compose exec backend ./generate_admin_key.sh`
- [ ] ✅ **OLLAMA_HOST đã được set**: Trong Dashboard → Settings → Environment Variables
- [ ] ✅ **Init function đã chạy**: Trong Dashboard → Functions → `init` → Run (QUAN TRỌNG!)
- [ ] ✅ **WorldStatus là "running"**: Trong Dashboard → Data → `worldStatus` → status phải là "running"
- [ ] ✅ **Có dữ liệu trong worlds**: Trong Dashboard → Data → `worlds` → phải có ít nhất 1 document
- [ ] ✅ **Có dữ liệu trong maps**: Trong Dashboard → Data → `maps` → phải có map data

**Nếu giao diện game không hiển thị gì**, xem phần [Troubleshooting Giao Diện](#troubleshooting-giao-diện) bên dưới.

### 8. Kiểm tra các services đang chạy

```bash
# Xem trạng thái containers
docker compose ps

# Kiểm tra ports đang lắng nghe
sudo netstat -tlnp | grep -E '5173|3210|3211|6791|11434'
```

## 💻 Truy Cập Từ Laptop

### 1. Đảm bảo laptop và server trong cùng mạng

- Kiểm tra laptop có thể ping đến server: `ping 10.0.12.81`
- Đảm bảo firewall trên server đã mở các port cần thiết

### 2. Truy cập các dịch vụ

Sau khi các services đã chạy, bạn có thể truy cập từ laptop:

- **Frontend (Ứng dụng chính)**: 
  ```
  http://10.0.12.81:5173
  ```

- **Convex Dashboard**: 
  ```
  http://10.0.12.81:6791
  ```
  (Sử dụng admin key đã tạo ở bước trên)

- **Convex Backend API**: 
  ```
  http://10.0.12.81:3210
  ```

- **Convex HTTP API**: 
  ```
  http://10.0.12.81:3211
  ```

- **Ollama API**: 
  ```
  http://10.0.12.81:11434
  ```

### 3. Kiểm tra kết nối từ laptop

Từ laptop của bạn, mở trình duyệt và truy cập:

```bash
# Test từ terminal (nếu có curl)
curl http://10.0.12.81:5173
curl http://10.0.12.81:3210/version
curl http://10.0.12.81:11434
```

## 👀 Xem Giao Diện và Trạng Thái Các Agent

Khi triển khai bằng Docker, bạn có **2 cách chính** để xem các agent đang chạy:

### 1. Giao Diện Game (Frontend) - Cách Trực Quan Nhất

**Truy cập**: `http://10.0.12.81:5173`

Đây là giao diện game chính nơi bạn có thể:
- ✅ **Xem các agent di chuyển** trong thế giới ảo theo thời gian thực
- ✅ **Xem các agent trò chuyện** với nhau
- ✅ **Xem vị trí và hành động** của từng agent
- ✅ **Tương tác** với các agent (nếu bạn là player)
- ✅ **Xem lịch sử tin nhắn** giữa các agent

**Cách sử dụng**:
1. Mở trình duyệt trên laptop
2. Truy cập `http://10.0.12.81:5173`
3. Bạn sẽ thấy map và các agent (nhân vật) di chuyển xung quanh
4. Click vào một agent để xem thông tin chi tiết
5. Xem các cuộc trò chuyện đang diễn ra

### 2. Convex Dashboard - Xem Dữ Liệu và Logs

**Truy cập**: `http://10.0.12.81:6791`

Đây là dashboard quản trị để xem dữ liệu backend:

**Đăng nhập**:
- Sử dụng admin key đã tạo ở bước trước
- Admin key được tạo bằng lệnh: `docker compose exec backend ./generate_admin_key.sh`

**Các tính năng trong Dashboard**:

#### a. Xem Dữ Liệu Agents trong Database

1. Vào tab **"Data"** hoặc **"Tables"**
2. Xem các bảng liên quan đến agents:
   - **`worlds`**: Chứa thông tin về tất cả agents đang hoạt động
     - Mở document `worlds` → xem field `agents` để thấy danh sách agents
     - Xem field `players` để thấy vị trí và trạng thái của agents
   - **`agentDescriptions`**: Mô tả về từng agent (tên, tính cách, kế hoạch)
   - **`memories`**: Ký ức của các agents (những gì họ nhớ về nhau)
   - **`worldStatus`**: Trạng thái của world (running/stopped/inactive)

#### b. Xem Logs của Agents

1. Vào tab **"Logs"**
2. Xem logs real-time của các functions:
   - Logs từ agent operations
   - Logs từ LLM calls
   - Logs từ game engine

#### c. Chạy Queries để Xem Trạng Thái Agents

1. Vào tab **"Functions"**
2. Chạy các queries có sẵn để xem dữ liệu:
   - `world:defaultWorldStatus` - Xem trạng thái world mặc định
   - Các queries khác trong `convex/world.ts`

#### d. Xem Functions và Actions

1. Vào tab **"Functions"**
2. Xem danh sách tất cả functions
3. Có thể chạy thủ công các functions để debug

### 3. Xem Logs từ Docker (Terminal)

Xem logs real-time của backend để theo dõi hoạt động của agents:

```bash
# Xem logs của backend (nơi agents chạy)
docker compose logs -f backend

# Xem logs của frontend
docker compose logs -f frontend

# Xem logs của tất cả services
docker compose logs -f
```

Trong logs bạn sẽ thấy:
- Agent operations đang chạy
- LLM API calls
- Game engine ticks
- Errors nếu có

### 4. Kiểm Tra Trạng Thái Agents Qua Convex CLI

Từ terminal trên server hoặc laptop (nếu đã cấu hình Convex CLI):

```bash
# Xem trạng thái world
docker compose exec backend npx convex run world:defaultWorldStatus

# Xem danh sách agents (cần tạo query tùy chỉnh)
# Hoặc xem trong dashboard
```

### 5. Các Bảng Dữ Liệu Quan Trọng để Xem Agents

Trong Convex Dashboard, các bảng sau chứa thông tin về agents:

| Bảng | Mô tả | Cách xem |
|------|-------|----------|
| `worlds` | Chứa tất cả agents đang hoạt động, vị trí, trạng thái | Data → worlds → mở document → xem field `agents` |
| `agentDescriptions` | Mô tả chi tiết về từng agent (identity, plan) | Data → agentDescriptions |
| `memories` | Ký ức của agents về các cuộc trò chuyện và mối quan hệ | Data → memories |
| `worldStatus` | Trạng thái world (running/stopped) | Data → worldStatus |
| `participatedTogether` | Lịch sử các agent đã trò chuyện với nhau | Data → participatedTogether |
| `messages` | Tin nhắn giữa các agents | Data → messages |

### 6. Tips để Theo Dõi Agents Hiệu Quả

1. **Mở 2 tab trình duyệt**:
   - Tab 1: `http://10.0.12.81:5173` - Xem giao diện game
   - Tab 2: `http://10.0.12.81:6791` - Xem dashboard

2. **Theo dõi logs**:
   ```bash
   docker compose logs -f backend | grep -i agent
   ```

3. **Kiểm tra agents đang hoạt động**:
   - Trong dashboard, vào `worlds` table
   - Xem field `agents` để thấy danh sách
   - Xem field `players` để thấy vị trí hiện tại

4. **Xem memories của agents**:
   - Vào `memories` table trong dashboard
   - Filter theo `playerId` để xem ký ức của một agent cụ thể

### 7. Troubleshooting: Không Thấy Agents

Nếu không thấy agents trong giao diện:

1. **Kiểm tra world status**:
   ```bash
   docker compose exec backend npx convex run world:defaultWorldStatus
   ```
   Đảm bảo status là `"running"`

2. **Khởi động lại engine**:
   ```bash
   docker compose exec backend npx convex run testing:kick
   ```

3. **Kiểm tra logs**:
   ```bash
   docker compose logs backend | tail -50
   ```

4. **Kiểm tra trong dashboard**:
   - Vào `worldStatus` table
   - Đảm bảo status là `"running"`
   - Nếu là `"inactive"`, world sẽ tự động restart khi có người xem

## 🎮 Hướng Dẫn Sử Dụng Giao Diện Frontend

Sau khi truy cập `http://10.0.12.81:5173`, bạn sẽ thấy giao diện AI Town. Dưới đây là hướng dẫn chi tiết:

### Chế Độ Xem (Spectating) - Không Cần Đăng Nhập

Bạn có thể xem các agents hoạt động mà không cần đăng nhập:

#### Các Thao Tác Cơ Bản:

1. **Di chuyển xung quanh thị trấn**:
   - **Click và kéo** chuột để di chuyển map
   - **Scroll** (cuộn chuột) để zoom in/out
   - Quan sát các agents di chuyển và tương tác với nhau

2. **Xem thông tin agent**:
   - **Click vào một agent** (nhân vật) để xem:
     - Tên và mô tả của agent
     - Lịch sử trò chuyện của agent
     - Các cuộc trò chuyện gần đây

3. **Theo dõi hoạt động**:
   - Xem các agents tự động di chuyển
   - Xem các cuộc trò chuyện diễn ra giữa các agents
   - Xem tin nhắn trong panel bên phải

### Chế Độ Tương Tác (Interactivity) - Cần Đăng Nhập

Để tham gia vào simulation và trò chuyện trực tiếp với agents, bạn cần đăng nhập:

#### Bước 1: Đăng Nhập

1. Click nút **"Login"** hoặc **"Sign In"** (nếu có cấu hình Clerk auth)
2. Hoặc nếu không có auth, bạn có thể tham gia với tư cách anonymous (tùy cấu hình)

#### Bước 2: Tham Gia Simulation

1. Sau khi đăng nhập, click nút **"Interact"**
2. Nhân vật của bạn sẽ xuất hiện trên map với một **vòng tròn được highlight** bên dưới
3. Bạn giờ đã là một phần của thế giới AI Town!

#### Các Điều Khiển (Controls):

1. **Di chuyển**:
   - **Click** vào vị trí trên map để di chuyển nhân vật của bạn đến đó
   - Nhân vật sẽ tự động đi bộ đến vị trí bạn click

2. **Bắt đầu trò chuyện với agent**:
   - **Click vào một agent** bạn muốn nói chuyện
   - Click nút **"Start conversation"**
   - Agent sẽ bắt đầu đi bộ về phía bạn
   - Khi agent đến gần, cuộc trò chuyện sẽ tự động bắt đầu
   - Bạn có thể gõ tin nhắn và gửi để trò chuyện với agent

3. **Rời khỏi cuộc trò chuyện**:
   - Đóng cửa sổ trò chuyện (click nút X)
   - Hoặc di chuyển đi xa khỏi agent
   - Cuộc trò chuyện sẽ kết thúc

4. **Nhận lời mời trò chuyện**:
   - Agents có thể chủ động đề xuất trò chuyện với bạn
   - Bạn sẽ thấy một nút **"Accept"** trong panel tin nhắn
   - Click để chấp nhận và bắt đầu trò chuyện

### Các Tính Năng Khác:

1. **Panel Tin Nhắn**:
   - Hiển thị tất cả các cuộc trò chuyện đang diễn ra
   - Xem tin nhắn giữa các agents
   - Xem tin nhắn của bạn với agents

2. **Nút Freeze/Unfreeze**:
   - Tạm dừng hoặc tiếp tục simulation
   - Hữu ích khi muốn quan sát kỹ hơn

3. **Nút Music**:
   - Bật/tắt nhạc nền (nếu có)

### Lưu Ý Quan Trọng:

⚠️ **Giới hạn người chơi**: 
- AI Town chỉ hỗ trợ **tối đa 8 người chơi** cùng lúc
- Nếu đã đủ 8 người, bạn sẽ phải đợi

⚠️ **Tự động rời khỏi khi idle**:
- Nếu bạn **không hoạt động trong 5 phút**, bạn sẽ tự động bị loại khỏi simulation
- Để tiếp tục, chỉ cần tương tác lại (di chuyển hoặc gửi tin nhắn)

### Tips Sử Dụng:

1. **Quan sát trước khi tương tác**:
   - Dành vài phút xem các agents hoạt động để hiểu cách họ tương tác
   - Xem các cuộc trò chuyện để hiểu tính cách của từng agent

2. **Tương tác tự nhiên**:
   - Trò chuyện với agents như với người thật
   - Agents có trí nhớ và sẽ nhớ các cuộc trò chuyện trước đó

3. **Khám phá thị trấn**:
   - Di chuyển xung quanh để xem các khu vực khác nhau
   - Mỗi agent có thể ở các vị trí khác nhau

4. **Theo dõi nhiều cuộc trò chuyện**:
   - Panel tin nhắn hiển thị tất cả các cuộc trò chuyện
   - Bạn có thể xem các agents trò chuyện với nhau

### Troubleshooting Giao Diện:

#### Giao Diện Không Hiển Thị Gì Cả (Màn Hình Trống)

**Nguyên nhân phổ biến nhất**: Database chưa được khởi tạo (chưa chạy init function).

**Các bước kiểm tra và sửa**:

1. **Kiểm tra database đã được khởi tạo chưa**:

   - Truy cập Dashboard: `http://10.0.12.81:6791`
   - Đăng nhập với admin key
   - Vào tab **"Data"** → **"Tables"**
   - Kiểm tra các bảng sau có dữ liệu chưa:
     - `worlds` - Phải có ít nhất 1 document
     - `worldStatus` - Phải có status là `"running"`
     - `maps` - Phải có map data
     - `agentDescriptions` - Phải có descriptions của agents

2. **Nếu các bảng trống, cần chạy init function**:

   **Cách 1: Qua Dashboard (Khuyến nghị)**:
   - Vào tab **"Functions"**
   - Tìm function `init`
   - Click **"Run"** hoặc **"Execute"**
   - Đợi function chạy xong (có thể mất vài giây)
   - Refresh trang game

   **Cách 2: Qua API** (nếu Dashboard không có chức năng Run):
   ```bash
   ADMIN_KEY="<admin-key-của-bạn>"
   curl -X POST "http://10.0.12.81:3210/api/mutation/init" \
     -H "Authorization: Bearer $ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. **Kiểm tra worldStatus phải là "running"**:

   - Trong Dashboard, vào `worldStatus` table
   - Đảm bảo `status` là `"running"` (không phải `"inactive"` hoặc `"stoppedByDeveloper"`)
   - Nếu không phải `"running"`, cần resume:
     - Vào Functions → tìm `testing:resume` → Run

4. **Kiểm tra frontend kết nối được với backend**:

   - Mở Developer Tools trong trình duyệt (F12)
   - Vào tab **Console**
   - Kiểm tra có lỗi kết nối không
   - Kiểm tra tab **Network** xem có request nào fail không

5. **Kiểm tra logs backend**:

   ```bash
   docker compose logs -f backend | tail -50
   ```
   - Tìm lỗi liên quan đến init, world, hoặc agents

6. **Kiểm tra OLLAMA_HOST đã được set chưa**:

   - Trong Dashboard, vào **Settings** → **Environment Variables**
   - Đảm bảo có biến `OLLAMA_HOST` với giá trị `http://10.0.12.81:11434` hoặc `http://host.docker.internal:11434`

7. **Restart services nếu cần**:

   ```bash
   docker compose restart backend
   docker compose restart frontend
   ```

**Sau khi chạy init, đợi 10-30 giây rồi refresh trang game**.

#### WorldStatus đã "running" nhưng Frontend vẫn lỗi

**Nguyên nhân có thể**:
1. Thiếu dữ liệu trong các bảng cần thiết
2. Frontend không kết nối được với backend
3. Lỗi JavaScript trong console
4. Environment variables không đúng

**Các bước kiểm tra và sửa**:

1. **Kiểm tra Console trong trình duyệt** (QUAN TRỌNG):
   - Mở Developer Tools (F12)
   - Vào tab **Console**
   - Xem có lỗi JavaScript nào không
   - Các lỗi thường gặp:
     - `Failed to fetch` → Frontend không kết nối được backend
     - `Cannot read property 'world' of undefined` → Thiếu dữ liệu world
     - `CORS error` → Vấn đề CORS

2. **Kiểm tra Network requests**:
   - Vào tab **Network** trong Developer Tools
   - Refresh trang
   - Kiểm tra các request đến backend:
     - Request đến `http://10.0.12.81:3210` có thành công không?
     - Có request nào bị fail (màu đỏ) không?
   - Nếu có lỗi 404 hoặc 500, kiểm tra backend logs

3. **Kiểm tra dữ liệu trong Database** (qua Dashboard):

   **Bước 1**: Kiểm tra `worlds` table:
   - Dashboard → Data → `worlds`
   - Phải có ít nhất 1 document
   - Mở document và kiểm tra:
     - Có field `players` (có thể là array rỗng)
     - Có field `agents` (có thể là array rỗng)
     - Có field `conversations` (có thể là array rỗng)

   **Bước 2**: Kiểm tra `maps` table:
   - Dashboard → Data → `maps`
   - Phải có ít nhất 1 document với `worldId` khớp với worldId trong `worldStatus`
   - Mở document và kiểm tra có các fields:
     - `width`, `height`
     - `tileSetUrl`, `bgTiles`, `objectTiles`

   **Bước 3**: Kiểm tra `worldStatus`:
   - Dashboard → Data → `worldStatus`
   - Đảm bảo:
     - `status` = `"running"`
     - `worldId` có giá trị hợp lệ
     - `engineId` có giá trị hợp lệ
     - `isDefault` = `true`

   **Bước 4**: Kiểm tra `engines` table:
   - Dashboard → Data → `engines`
   - Phải có engine với ID khớp với `engineId` trong `worldStatus`

4. **Kiểm tra VITE_CONVEX_URL trong frontend**:

   ```bash
   # Kiểm tra docker-compose.yml
   cat docker-compose.yml | grep VITE_CONVEX_URL
   ```

   Phải là:
   ```yaml
   environment:
     - VITE_CONVEX_URL=http://10.0.12.81:3210
   ```

   **⚠️ Lưu ý quan trọng**: URL phải có dấu `:` giữa IP và port:
   - ✅ Đúng: `http://10.0.12.81:3210`
   - ❌ Sai: `http://10.0.12.81.3210` (thiếu dấu `:`)

   Nếu sai, sửa trong `docker-compose.yml`:
   ```yaml
   frontend:
     environment:
       - VITE_CONVEX_URL=http://10.0.12.81:3210
   ```

   Sau đó restart:
   ```bash
   docker compose restart frontend
   # Hoặc rebuild nếu cần
   docker compose up -d --build frontend
   ```

5. **Kiểm tra backend đang chạy**:

   ```bash
   # Kiểm tra backend container
   docker compose ps backend
   
   # Kiểm tra logs backend
   docker compose logs backend | tail -50
   
   # Test backend API
   curl http://10.0.12.81:3210/version
   ```

6. **Kiểm tra frontend container**:

   ```bash
   # Kiểm tra frontend container
   docker compose ps frontend
   
   # Kiểm tra logs frontend
   docker compose logs frontend | tail -50
   ```

7. **Nếu thiếu dữ liệu, chạy init lại**:

   - Dashboard → Functions → `init` → Run
   - Hoặc reset hoàn toàn:
     - Dashboard → Functions → `testing:wipeAllTables` → Run
     - Sau đó Dashboard → Functions → `init` → Run

8. **Kiểm tra CORS (nếu có lỗi CORS)**:

   - Lỗi CORS thường xảy ra khi frontend và backend không cùng origin
   - Đảm bảo `VITE_CONVEX_URL` trỏ đúng đến backend
   - Kiểm tra backend có cho phép CORS từ frontend không

9. **Restart tất cả services**:

   ```bash
   docker compose restart
   ```

   Sau đó đợi 10-30 giây và refresh trang.

10. **Kiểm tra agents đã được tạo chưa**:

    - Dashboard → Data → `worlds` → mở document → xem field `agents`
    - Nếu `agents` là array rỗng `[]`, agents chưa được tạo
    - Chạy init lại hoặc đợi vài phút để agents được tạo tự động

**Lưu ý**: Sau mỗi bước, refresh trang game và kiểm tra lại.

#### Không thấy agents (nhưng có map)

- Đợi vài giây để simulation khởi động và agents được tạo
- Refresh trang nếu cần
- Kiểm tra trong Dashboard → `worlds` table → xem field `agents` có dữ liệu không
- Kiểm tra logs backend: `docker compose logs backend | grep -i agent`
- Nếu agents vẫn chưa có sau vài phút, chạy init lại

#### Không thể di chuyển

- Đảm bảo bạn đã click vào map, không phải vào agent
- Thử zoom out để thấy map rõ hơn
- Kiểm tra console trong Developer Tools có lỗi không

#### Không thể trò chuyện

- Đảm bảo bạn đã đăng nhập và click "Interact"
- Đảm bảo agent đã đến gần bạn (trong vòng tròn)
- Kiểm tra xem có đủ 8 người chơi chưa

## 🔄 Quản Lý Services

### Dừng services

```bash
cd ~/ai-town
docker compose stop
```

### Khởi động lại services

```bash
docker compose start
```

### Dừng và xóa containers

```bash
docker compose down
```

### Xem logs real-time

```bash
docker compose logs -f
```

### Restart một service cụ thể

```bash
docker compose restart frontend
docker compose restart backend
```

## 🐛 Khắc Phục Sự Cố

### 1. Lỗi "address already in use" cho port 11434

**Lỗi**: 
```
ERROR: failed to bind host port for 0.0.0.0:11434: address already in use
```

**Nguyên nhân**: Port 11434 đã được sử dụng bởi Ollama đang chạy trên host.

**Giải pháp**:

#### Cách 1: Xóa port mapping Ollama trong docker-compose.yml (Khuyến nghị)

File `docker-compose.yml` đã được cập nhật để không map port 11434 từ container. Ollama nên chạy trên host, không phải trong container.

Nếu bạn vẫn gặp lỗi, kiểm tra file `docker-compose.yml` và đảm bảo không có dòng:
```yaml
- '${OLLAMA_PORT:-11434}:11434'
```

#### Cách 2: Dừng Ollama trên host (nếu không cần)

Nếu bạn muốn chạy Ollama trong container (không khuyến nghị), dừng Ollama trên host:

```bash
# Kiểm tra process đang dùng port 11434
sudo lsof -i :11434
# Hoặc
sudo netstat -tlnp | grep 11434

# Dừng Ollama service
sudo systemctl stop ollama

# Hoặc kill process
sudo kill -9 <PID>
```

#### Cách 3: Thay đổi port Ollama

Nếu bạn muốn chạy Ollama trên port khác:

1. Cấu hình Ollama chạy trên port khác (ví dụ 11435):
```bash
export OLLAMA_HOST=0.0.0.0:11435
ollama serve
```

2. Cập nhật docker-compose.yml:
```yaml
ports:
  - '11435:11434'  # Map port 11435 host -> 11434 container
```

3. Cập nhật OLLAMA_HOST trong Convex:
```bash
docker compose exec backend npx convex env set OLLAMA_HOST http://host.docker.internal:11435
```

**Lưu ý**: Cách tốt nhất là để Ollama chạy trên host và backend container kết nối qua `host.docker.internal:11434`.

### 2. Lỗi "Could not resolve host: host.docker.internal"

**Lỗi**:
```
curl: (6) Could not resolve host: host.docker.internal
```

**Nguyên nhân**: Trên Linux, `host.docker.internal` không được hỗ trợ mặc định (chỉ có trên Mac/Windows).

**Giải pháp**:

#### Cách 1: Thêm extra_hosts vào docker-compose.yml (Đã cập nhật)

File `docker-compose.yml` đã được cập nhật với `extra_hosts` để hỗ trợ `host.docker.internal` trên Linux:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Sau khi thêm, restart containers:

```bash
docker compose down
docker compose up -d
```

#### Cách 2: Sử dụng IP gateway của Docker network

1. **Lấy IP gateway**:
```bash
docker network inspect ai-town_ai-town-network | grep Gateway
# Hoặc
ip addr show docker0 | grep inet
```

2. **Sử dụng IP gateway thay vì host.docker.internal**:
```bash
cd ~/ai-town
npx convex env set OLLAMA_HOST http://172.18.0.1:11434
# (Thay 172.18.0.1 bằng IP gateway thực tế của bạn)
```

#### Cách 3: Sử dụng IP của host trực tiếp

```bash
cd ~/ai-town
npx convex env set OLLAMA_HOST http://10.0.12.81:11434
```

**Lưu ý**: Với cách này, đảm bảo Ollama đang lắng nghe trên `0.0.0.0:11434` (tất cả interfaces), không chỉ `127.0.0.1:11434`.

### 3. Lỗi "ReferenceError: File is not defined" khi chạy npx convex

**Lỗi**:
```
ReferenceError: File is not defined
    at ../common/temp/node_modules/.pnpm/undici@7.16.0/node_modules/undici/lib/web/webidl/index.js
```

**Nguyên nhân**: Convex CLI gặp vấn đề tương thích với Node.js v18.19.1 hoặc một số version cũ.

**Giải pháp**:

#### Giải pháp 1: Sử dụng Dashboard (Khuyến nghị - Dễ nhất)

Không cần CLI, chỉ cần dùng Dashboard:

1. Truy cập `http://10.0.12.81:6791`
2. Đăng nhập với admin key
3. Vào **Settings** → **Environment Variables**
4. Thêm biến:
   - Key: `OLLAMA_HOST`
   - Value: `http://10.0.12.81:11434` hoặc `http://host.docker.internal:11434`
5. Click **Save**

#### Giải pháp 2: Cài đặt Convex CLI globally

```bash
# Cài đặt globally
npm install -g convex

# Sau đó sử dụng lệnh convex thay vì npx convex
cd ~/ai-town
convex env set OLLAMA_HOST http://10.0.12.81:11434
```

#### Giải pháp 3: Cập nhật Node.js lên version 20+

Nếu chưa có nvm, cài đặt nvm trước:

```bash
# Cài đặt nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash

# Tải lại shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"

# Hoặc logout và login lại
```

Sau đó cài Node.js 20:

```bash
# Cài đặt Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Kiểm tra version
node --version  # Nên là v20.x.x

# Cài lại Convex CLI với Node.js 20
npm install -g convex

# Sau đó thử lại
cd ~/ai-town
convex env set OLLAMA_HOST http://10.0.12.81:11434
```

**Hoặc cài Node.js 20 trực tiếp không dùng nvm**:

```bash
# Tải và cài Node.js 20 từ NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra version
node --version  # Nên là v20.x.x

# Cài lại Convex CLI
npm install -g convex

# Thử lại
cd ~/ai-town
convex env set OLLAMA_HOST http://10.0.12.81:11434
```

#### Giải pháp 4: Sử dụng API trực tiếp

Nếu tất cả các cách trên không hoạt động, có thể set qua API:

```bash
# Lấy admin key từ .env.local
ADMIN_KEY="<admin-key-của-bạn>"

# Set OLLAMA_HOST qua API
curl -X POST "http://10.0.12.81:3210/api/setEnvironmentVariable" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "OLLAMA_HOST", "value": "http://10.0.12.81:11434"}'
```

**Lưu ý**: 
- ⭐ **Cách tốt nhất và đơn giản nhất là sử dụng Dashboard** (Giải pháp 1) - Không cần CLI, không cần cập nhật Node.js
- Nếu muốn dùng CLI, bạn **PHẢI** cập nhật Node.js lên v20+ vì Convex CLI không tương thích với Node.js v18

### 4. Lỗi "Unable to read your package.json" khi set environment variables

**Lỗi**:
```
✖ Unable to read your package.json: Error: ENOENT: no such file or directory
```

**Nguyên nhân**: Lệnh `npx convex env set` cần chạy từ thư mục có `package.json`, không thể chạy từ trong container backend.

**Giải pháp**:

1. **Chạy từ host** (đảm bảo đã cài Convex CLI):

```bash
cd ~/ai-town

# Đảm bảo đã có .env.local với:
# CONVEX_SELF_HOSTED_URL=http://10.0.12.81:3210
# CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key>"

# Sử dụng convex (đã cài globally) thay vì npx convex
convex env set OLLAMA_HOST http://10.0.12.81:11434
```

2. **Hoặc set qua Dashboard** (Khuyến nghị):
   - Truy cập `http://10.0.12.81:6791`
   - Đăng nhập với admin key
   - Vào Settings → Environment Variables
   - Thêm biến môi trường

### 4. Lỗi "Could not resolve 'convex/server'" khi chạy Convex CLI

**Lỗi**:
```
✘ [ERROR] Could not resolve "convex/server"
    convex-virtual-config:./convex/convex.config.js:1:26:
      1 │ import { defineApp } from "convex/server";
```

**Nguyên nhân**: 
- Chưa cài dependencies (`npm install`)
- Hoặc đang dùng Node.js v18 (Convex CLI cần Node.js v20+)

**Giải pháp**:

#### Giải pháp 1: Cài dependencies (Nếu chưa cài)

```bash
cd ~/ai-town
npm install
```

Sau đó thử lại. **Nhưng lưu ý**: Bạn vẫn cần Node.js v20+ để dùng Convex CLI.

#### Giải pháp 2: Sử dụng Dashboard (Khuyến nghị - Không cần CLI)

Thay vì dùng CLI, sử dụng Dashboard:
- Truy cập `http://10.0.12.81:6791`
- Đăng nhập với admin key
- Vào **Functions** → chạy functions
- Vào **Settings** → set environment variables

#### Giải pháp 3: Cài Node.js 20+ (Nếu muốn dùng CLI)

Xem hướng dẫn ở phần [Lỗi "ReferenceError: File is not defined"](#4-lỗi-referenceerror-file-is-not-defined-khi-chạy-init-hoặc-các-lệnh-convex-cli) bên dưới.

### 5. Cảnh báo "Engine is not active!" khi chạy init

**Cảnh báo**:
```
warn: 'Engine ... is not active! Run "npx convex run testing:resume" to restart it.'
```

**Nguyên nhân**: 
- WorldStatus không phải `"running"` (có thể là `"inactive"` hoặc `"stoppedByDeveloper"`)
- Init function chỉ chạy khi worldStatus là `"running"`

**Giải pháp**:

#### Bước 1: Resume Engine trước

**Qua Dashboard**:
1. Truy cập: `http://10.0.12.81:6791`
2. Vào **Functions** → `testing:resume` → **Run**
3. Bạn sẽ thấy log: `'Resuming engine ... for world ... (state: inactive)...'`
4. Đợi vài giây (5-10 giây) để engine start hoàn toàn

**Lưu ý**: Log "Resuming engine ... (state: inactive)..." là **bình thường** - có nghĩa là engine đang được khởi động lại từ trạng thái inactive.

**Hoặc qua API**:
```bash
ADMIN_KEY="<admin-key>"
curl -X POST "http://10.0.12.81:3210/api/mutation/testing:resume" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Bước 2: Kiểm tra WorldStatus

Trong Dashboard → Data → `worldStatus`:
- Phải có `status` = `"running"`
- Nếu vẫn không phải "running", thử kick engine (xem bước 3)

#### Bước 3: Kick Engine (Nếu resume không hoạt động)

**Qua Dashboard**:
- Functions → `testing:kick` → **Run**

**Hoặc qua API**:
```bash
curl -X POST "http://10.0.12.81:3210/api/mutation/testing:kick" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Bước 4: Chạy Init lại

Sau khi worldStatus đã là "running":
- Functions → `init` → **Run**

**Thứ tự đúng**:
1. ✅ `testing:resume` (hoặc `testing:kick`) → để start engine
2. ✅ Kiểm tra worldStatus = "running"
3. ✅ `init` → để tạo agents

**Lưu ý**: 
- Init function sẽ không tạo agents nếu worldStatus không phải "running"
- Phải chạy resume/kick trước, sau đó mới chạy init

### 6. WorldStatus hiển thị "invalid" hoặc có lỗi

**Lỗi**: 
- WorldStatus hiển thị "invalid" trong Dashboard
- Hoặc có lỗi khi chạy `testing:resume`

**Nguyên nhân**: 
- Database chưa được khởi tạo đúng cách
- Hoặc dữ liệu bị corrupt/invalid
- Hoặc thiếu dữ liệu cần thiết (worlds, maps, engines)

**Giải pháp**:

#### Giải pháp 1: Reset và khởi tạo lại database (Khuyến nghị)

1. **Xóa toàn bộ dữ liệu cũ** (qua Dashboard):
   - Truy cập Dashboard: `http://10.0.12.81:6791`
   - Vào **Functions** → tìm function `testing:wipeAllTables`
   - Click **Run** để xóa tất cả dữ liệu

2. **Hoặc xóa qua API**:
   ```bash
   ADMIN_KEY="<admin-key>"
   curl -X POST "http://10.0.12.81:3210/api/mutation/testing:wipeAllTables" \
     -H "Authorization: Bearer $ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. **Chạy init lại**:
   - Trong Dashboard → **Functions** → `init` → **Run**
   - Hoặc qua API:
     ```bash
     curl -X POST "http://10.0.12.81:3210/api/mutation/init" \
       -H "Authorization: Bearer $ADMIN_KEY" \
       -H "Content-Type: application/json" \
       -d '{}'
     ```

4. **Kiểm tra kết quả**:
   - Dashboard → **Data** → `worldStatus` → phải có status là `"running"`
   - Dashboard → **Data** → `worlds` → phải có ít nhất 1 document
   - Dashboard → **Data** → `maps` → phải có map data

#### Giải pháp 2: Resume world nếu đang inactive

Nếu worldStatus là `"inactive"` hoặc `"stoppedByDeveloper"`:

1. **Qua Dashboard**:
   - Vào **Functions** → `testing:resume` → **Run**

2. **Qua API**:
   ```bash
   curl -X POST "http://10.0.12.81:3210/api/mutation/testing:resume" \
     -H "Authorization: Bearer $ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

#### Giải pháp 3: Kiểm tra và sửa dữ liệu thủ công

1. **Kiểm tra trong Dashboard**:
   - `worldStatus` → đảm bảo có `worldId`, `engineId`, `status`
   - `worlds` → đảm bảo có document với ID khớp với `worldId` trong `worldStatus`
   - `engines` → đảm bảo có engine với ID khớp với `engineId` trong `worldStatus`

2. **Nếu thiếu dữ liệu**, chạy init lại (xem Giải pháp 1)

**Lưu ý**: Sau khi reset và chạy init lại, đợi 10-30 giây rồi refresh trang game.

### 6. Lỗi "ReferenceError: File is not defined" khi chạy init hoặc các lệnh Convex CLI

**Lỗi**:
```
ReferenceError: File is not defined
    at ../common/temp/node_modules/.pnpm/undici@7.16.0/node_modules/undici/lib/web/webidl/index.js
```

**Nguyên nhân**: Convex CLI **KHÔNG tương thích** với Node.js v18. Bạn **PHẢI** cài Node.js v20+ để sử dụng Convex CLI.

**Giải pháp**:

#### Giải pháp 1: Sử dụng Dashboard (Khuyến nghị - Không cần CLI)

Thay vì dùng CLI, sử dụng Dashboard:

1. **Chạy init function qua Dashboard**:
   - Truy cập `http://10.0.12.81:6791`
   - Đăng nhập với admin key
   - Vào **Functions** → tìm function `init` → Click **Run** hoặc **Execute**

2. **Set environment variables qua Dashboard**:
   - Vào **Settings** → **Environment Variables**
   - Thêm biến môi trường

#### Giải pháp 2: Cài Node.js 20+ (Bắt buộc nếu muốn dùng CLI)

```bash
# Cài nvm (nếu chưa có)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc

# Cài Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Kiểm tra
node --version  # Phải là v20.x.x

# Cài lại Convex CLI
npm install -g convex

# Sau đó mới có thể dùng các lệnh
cd ~/ai-town
convex dev --run init --until-success
```

**Lưu ý**: ⭐ **Cách tốt nhất là dùng Dashboard** - không cần cài Node.js 20, không gặp lỗi, dễ sử dụng hơn.

### 5. Ollama không kết nối được từ Docker

Nếu backend trong Docker không kết nối được với Ollama trên host:

```bash
# Kiểm tra Ollama có chạy không
curl http://localhost:11434

# Test từ trong container (sau khi đã thêm extra_hosts)
docker compose exec backend curl http://host.docker.internal:11434

# Nếu không được, thử dùng IP gateway
docker network inspect ai-town_ai-town-network | grep Gateway
# Sau đó test với IP gateway
docker compose exec backend curl http://<gateway-ip>:11434

# Hoặc dùng IP host trực tiếp
docker compose exec backend curl http://10.0.12.81:11434
```

Nếu vẫn không được, cấu hình Docker network:

```bash
# Thêm vào docker-compose.yml trong phần backend:
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### 2. Port đã được sử dụng

Nếu gặp lỗi port đã được sử dụng:

```bash
# Kiểm tra process đang dùng port
sudo lsof -i :5173
sudo lsof -i :3210

# Kill process nếu cần
sudo kill -9 <PID>
```

### 3. Lỗi "Invalid deployment address" - URL sai format

**Lỗi**:
```
Uncaught Error: Invalid deployment address: "http://10.0.12.81.3210" is not a valid URL.
```

**Nguyên nhân**: URL bị sai format - thiếu dấu `:` giữa IP và port (đang là `.` thay vì `:`).

**Giải pháp**:

1. **Kiểm tra và sửa docker-compose.yml**:

   ```bash
   # Kiểm tra
   cat docker-compose.yml | grep VITE_CONVEX_URL
   ```

   Phải là:
   ```yaml
   frontend:
     environment:
       # ✅ ĐÚNG: Có dấu : giữa IP và port
       - VITE_CONVEX_URL=http://10.0.12.81:3210
   ```

   Nếu sai (thiếu dấu `:`), sửa trong `docker-compose.yml`:
   ```yaml
   frontend:
     environment:
       - VITE_CONVEX_URL=http://10.0.12.81:3210  # Đảm bảo có dấu :
   ```

2. **Kiểm tra file .env hoặc .env.local** (nếu có):

   ```bash
   # Kiểm tra
   cat .env 2>/dev/null | grep VITE_CONVEX_URL || echo "No .env file"
   cat .env.local 2>/dev/null | grep VITE_CONVEX_URL || echo "No .env.local file"
   ```

   Nếu có và sai, sửa:
   ```env
   VITE_CONVEX_URL=http://10.0.12.81:3210
   ```

3. **Restart frontend**:

   ```bash
   docker compose restart frontend
   ```

   Hoặc rebuild nếu cần:
   ```bash
   docker compose up -d --build frontend
   ```

4. **Clear browser cache và refresh**:
   - Mở Developer Tools (F12)
   - Click chuột phải vào nút Refresh
   - Chọn "Empty Cache and Hard Reload"

**Lưu ý**: 
- ✅ URL đúng: `http://10.0.12.81:3210` (có dấu `:`)
- ❌ URL sai: `http://10.0.12.81.3210` (thiếu dấu `:`, có dấu `.`)

### 4. Lỗi "Unexpected non-whitespace character after JSON" khi interactive với agent

**Lỗi**:
```
Uncaught SyntaxError: Unexpected non-whitespace character after JSON at position 4
    at ollamaFetchEmbedding (../../convex/util/llm.ts:703:3)
```

**Nguyên nhân**: 
- Ollama embedding model chưa được tải
- Hoặc Ollama API trả về response không phải JSON hợp lệ
- Hoặc model embedding không tương thích

**Giải pháp**:

#### Bước 1: Kiểm tra model embedding đã được tải chưa

```bash
# Kiểm tra các model đã tải
ollama list

# Phải thấy model: mxbai-embed-large
# Nếu không có, tải model:
ollama pull mxbai-embed-large
```

#### Bước 2: Test Ollama Embedding API

```bash
# Test embedding API
curl http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "mxbai-embed-large", "prompt": "test"}'
```

Response phải là JSON hợp lệ:
```json
{
  "embedding": [0.123, 0.456, ...]
}
```

Nếu không phải JSON hoặc có lỗi, xem bước 3.

#### Bước 3: Kiểm tra OLLAMA_HOST đã được set đúng chưa

Trong Dashboard → Settings → Environment Variables:
- Key: `OLLAMA_HOST`
- Value: `http://10.0.12.81:11434` hoặc `http://host.docker.internal:11434`

#### Bước 4: Kiểm tra Ollama đang chạy và accessible

```bash
# Test từ host
curl http://localhost:11434

# Test từ container
docker compose exec backend curl http://host.docker.internal:11434
# Hoặc
docker compose exec backend curl http://10.0.12.81:11434
```

#### Bước 5: Kiểm tra model embedding dimension

Model `mxbai-embed-large` phải có dimension 1024. Kiểm tra trong code:

```bash
# Kiểm tra trong convex/util/llm.ts
grep OLLAMA_EMBEDDING_DIMENSION convex/util/llm.ts
```

Phải là:
```typescript
const OLLAMA_EMBEDDING_DIMENSION = 1024;
```

#### Bước 6: Restart backend sau khi tải model

Sau khi tải model embedding:

```bash
docker compose restart backend
```

#### Bước 7: Kiểm tra logs backend

```bash
docker compose logs backend | grep -i embedding
docker compose logs backend | grep -i ollama
```

Tìm lỗi liên quan đến embedding hoặc Ollama.

**Lưu ý**: 
- Model `mxbai-embed-large` cần khoảng 1.3GB dung lượng
- Đảm bảo có đủ RAM và dung lượng ổ cứng
- Nếu model chưa được tải, Ollama sẽ tự động tải khi được gọi, nhưng có thể mất thời gian

### 5. Lỗi "Documents changed while mutation was being run" - Transaction Conflict

**Lỗi**:
```
ERROR: Documents read from or written to the "engines" table changed while this mutation was being run
A call to "cron_commit_mutation" changed the document with ID "..."
```

**Nguyên nhân**: 
- Transaction conflict trong Convex khi có nhiều mutations cố gắng update cùng một document trong bảng "engines" cùng lúc
- Đây là cơ chế bảo vệ của Convex để đảm bảo tính nhất quán dữ liệu
- Thường xảy ra khi:
  - Game engine đang chạy và update engine state
  - Có cron job hoặc mutation khác cũng đang cố update cùng engine
  - Có nhiều runStep actions chạy đồng thời

**Giải pháp**:

#### Giải pháp 1: Đây thường là lỗi transient (tạm thời)

Lỗi này thường **tự giải quyết** sau vài giây vì Convex sẽ retry mutations. Bạn có thể:
- Đợi vài giây và thử lại
- Refresh trang frontend
- Game sẽ tiếp tục hoạt động bình thường

#### Giải pháp 2: Kick Engine để reset

Nếu lỗi tiếp tục xảy ra:

**Qua Dashboard**:
- Functions → `testing:kick` → **Run**

**Hoặc qua API**:
```bash
curl -X POST "http://10.0.12.81:3210/api/mutation/testing:kick" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Giải pháp 3: Kiểm tra Cron Jobs

Cron jobs có thể gây conflict nếu chạy quá thường xuyên:

```bash
# Kiểm tra logs để xem cron jobs
docker compose logs backend | grep -i cron
```

Nếu có quá nhiều cron jobs chạy, có thể cần điều chỉnh tần suất trong `convex/crons.ts`.

#### Giải pháp 4: Restart Backend (Nếu lỗi nghiêm trọng)

Nếu lỗi tiếp tục và không tự giải quyết:

```bash
docker compose restart backend
```

#### Giải pháp 5: Kiểm tra chỉ có 1 instance engine đang chạy

Trong Dashboard → Data → `engines`:
- Đảm bảo chỉ có 1 engine document với `running: true`
- Nếu có nhiều engines đang chạy, có thể gây conflict

**Lưu ý**: 
- ⚠️ Đây là lỗi **bình thường** trong hệ thống concurrent như Convex
- ✅ Thường **tự giải quyết** sau vài giây
- ✅ Không ảnh hưởng đến dữ liệu, chỉ là warning về transaction conflict
- ✅ Game sẽ tiếp tục hoạt động sau khi conflict được giải quyết

**Khi nào cần lo lắng**:
- Nếu lỗi xuất hiện **liên tục** (nhiều lần mỗi giây)
- Nếu game **hoàn toàn không hoạt động** sau vài phút
- Nếu có nhiều engines đang chạy cùng lúc

Trong các trường hợp đó, kick engine hoặc restart backend.

### 6. Frontend không kết nối được backend

Kiểm tra biến môi trường `VITE_CONVEX_URL` trong `docker-compose.yml`:

```yaml
frontend:
  environment:
    - VITE_CONVEX_URL=http://10.0.12.81:3210
```

Sau đó rebuild:

```bash
docker compose up --build -d frontend
```

### 4. Database chưa được khởi tạo

```bash
# Xóa và khởi tạo lại
docker compose exec backend npx convex run testing:wipeAllTables
docker compose exec backend npx convex dev --run init --until-success
```

### 5. Kiểm tra logs chi tiết

```bash
# Logs của tất cả services
docker compose logs

# Logs của một service cụ thể
docker compose logs backend
docker compose logs frontend

# Logs real-time
docker compose logs -f backend
```

### 6. Reset hoàn toàn

Nếu cần reset toàn bộ:

```bash
# Dừng và xóa containers, volumes
docker compose down -v

# Xóa images (nếu cần)
docker compose down --rmi all

# Build lại từ đầu
docker compose up --build -d
```

### 7. Kiểm tra kết nối mạng

```bash
# Từ server, test kết nối đến chính nó
curl http://10.0.12.81:5173
curl http://10.0.12.81:3210/version

# Từ laptop, test kết nối đến server
ping 10.0.12.81
telnet 10.0.12.81 5173
```

### 8. Vấn đề với permissions

```bash
# Đảm bảo user có quyền truy cập Docker
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra quyền
docker ps
```

## 📝 Các Lệnh Hữu Ích

### Quản lý Ollama

```bash
# Xem các model đã tải
ollama list

# Xóa model
ollama rm llama3

# Chạy model
ollama run llama3

# Xem thông tin model
ollama show llama3
```

### Quản lý Docker

```bash
# Xem tất cả containers
docker ps -a

# Xem disk usage
docker system df

# Dọn dẹp không sử dụng
docker system prune -a

# Xem logs của container
docker logs <container-id>
```

### Quản lý Convex

```bash
# Xem environment variables
docker compose exec backend npx convex env list

# Set environment variable
docker compose exec backend npx convex env set KEY value

# Chạy function
docker compose exec backend npx convex run functionName

# Xem dashboard
# Truy cập http://10.0.12.81:6791
```

## 🎯 Bước Tiếp Theo

Sau khi triển khai thành công:

1. **Tùy chỉnh nhân vật**: Chỉnh sửa file `data/characters.ts`
2. **Tùy chỉnh map**: Sử dụng Tiled editor để tạo map mới
3. **Cấu hình LLM**: Thay đổi model hoặc provider trong `convex/util/llm.ts`
4. **Thêm tính năng**: Xem `ARCHITECTURE.md` để hiểu cấu trúc dự án

## 📚 Tài Liệu Tham Khảo

- [Convex Documentation](https://docs.convex.dev)
- [Ollama Documentation](https://ollama.ai)
- [Docker Documentation](https://docs.docker.com)
- [AI Town GitHub](https://github.com/a16z-infra/ai-town)

## 💡 Lưu Ý

- Đảm bảo server có đủ RAM để chạy Ollama (tối thiểu 4GB, khuyến nghị 8GB+)
- Model `llama3` cần khoảng 4.7GB dung lượng
- Nếu gặp vấn đề về hiệu suất, có thể giảm `NUM_MEMORIES_TO_SEARCH` trong `convex/constants.ts`
- Để chạy production, nên sử dụng reverse proxy (như Nginx) và SSL certificate

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs: `docker compose logs -f`
2. Kiểm tra firewall: `sudo ufw status`
3. Kiểm tra network: `ping 10.0.12.81`
4. Xem [Troubleshooting section](#khắc-phục-sự-cố) ở trên

---

**Chúc bạn triển khai thành công! 🎉**

