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

#### Cách 1: Set từ host (Khuyến nghị)

1. **Cấu hình Convex CLI để kết nối với self-hosted backend**:

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

2. **Set OLLAMA_HOST từ host**:

```bash
cd ~/ai-town

# Set OLLAMA_HOST (sử dụng host.docker.internal nếu đã cấu hình extra_hosts)
npx convex env set OLLAMA_HOST http://host.docker.internal:11434

# HOẶC sử dụng IP trực tiếp (nếu host.docker.internal không hoạt động)
npx convex env set OLLAMA_HOST http://10.0.12.81:11434
```

#### Cách 2: Set qua Convex Dashboard

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

```bash
cd ~/ai-town

# Đảm bảo đã có .env.local với CONVEX_SELF_HOSTED_URL và CONVEX_SELF_HOSTED_ADMIN_KEY
# Chạy lệnh init để khởi tạo database
npx convex dev --run init --until-success
```

### 7. Kiểm tra các services đang chạy

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

**Không thấy agents**:
- Đợi vài giây để simulation khởi động
- Refresh trang nếu cần
- Kiểm tra logs backend

**Không thể di chuyển**:
- Đảm bảo bạn đã click vào map, không phải vào agent
- Thử zoom out để thấy map rõ hơn

**Không thể trò chuyện**:
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

### 3. Lỗi "Unable to read your package.json" khi set environment variables

**Lỗi**:
```
✖ Unable to read your package.json: Error: ENOENT: no such file or directory
```

**Nguyên nhân**: Lệnh `npx convex env set` cần chạy từ thư mục có `package.json`, không thể chạy từ trong container backend.

**Giải pháp**:

1. **Chạy từ host** (khuyến nghị):

```bash
cd ~/ai-town

# Đảm bảo đã có .env.local với:
# CONVEX_SELF_HOSTED_URL=http://10.0.12.81:3210
# CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key>"

# Sau đó chạy lệnh
npx convex env set OLLAMA_HOST http://10.0.12.81:11434
```

2. **Hoặc set qua Dashboard**:
   - Truy cập `http://10.0.12.81:6791`
   - Đăng nhập với admin key
   - Vào Settings → Environment Variables
   - Thêm biến môi trường

### 4. Ollama không kết nối được từ Docker

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

### 3. Frontend không kết nối được backend

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

