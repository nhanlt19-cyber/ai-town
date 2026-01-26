# Giải pháp Sửa Lỗi Performance và Timeout

## Vấn đề

Khi click "Interact", frontend hiển thị "Joining..." rất lâu (>= 10 phút) và gặp các lỗi:
- `Function execution timed out (maximum duration: 600s)` - Convex function timeout sau 10 phút
- CPU gần full (32 vCPU)
- Memory cao (9GB/32GB)
- Frontend lag và không di chuyển được
- `ERR_NAME_NOT_RESOLVED` trong console

## Nguyên nhân

1. **Engine quá tải**: Engine đang xử lý quá nhiều agents cùng lúc
2. **Ollama quá tải**: Mỗi agent cần gọi Ollama để generate responses, quá nhiều requests đồng thời
3. **waitForInput không có timeout**: Frontend chờ vô hạn cho đến khi input được xử lý
4. **Quá nhiều agents**: Mặc định tạo tất cả agents từ `Descriptions.length` (có thể 20+ agents)

## Giải pháp đã thực hiện

### 1. Thêm Timeout cho waitForInput

File `src/hooks/sendInput.ts` đã được cập nhật:
- Thêm parameter `timeoutMs` (mặc định 60 giây)
- Nếu input không được xử lý trong thời gian timeout, sẽ throw error thay vì chờ vô hạn
- Frontend sẽ fail fast thay vì chờ 10 phút

### 2. Cải thiện Error Handling

File `src/components/buttons/InteractButton.tsx`:
- Sử dụng timeout 30 giây cho join operation
- Hiển thị error message rõ ràng khi timeout
- Gợi ý kiểm tra engine status khi timeout

## Giải pháp Khắc phục Ngay lập tức

### Bước 1: Kiểm tra và Giảm số lượng Agents

1. **Kiểm tra số lượng agents hiện tại**:
   ```bash
   # Vào Convex Dashboard: http://10.0.12.81:3211
   # Xem table "worlds" -> tìm world của bạn -> xem field "agents"
   ```

2. **Xóa tất cả agents và tạo lại với số lượng ít hơn**:
   ```bash
   # Trong Convex Dashboard, chạy function:
   testing:wipeAllTables
   
   # Sau đó chạy init với số lượng agents ít hơn (ví dụ 5 agents):
   init({ numAgents: 5 })
   ```

3. **Hoặc sửa code để giảm số agents mặc định**:
   - Sửa file `convex/init.ts`:
     ```typescript
     const toCreate = args.numAgents !== undefined ? args.numAgents : 5; // Thay vì Descriptions.length
     ```

### Bước 2: Kiểm tra Ollama

1. **Kiểm tra Ollama có đang chạy**:
   ```bash
   curl http://10.0.12.81:11434/api/tags
   ```

2. **Kiểm tra Ollama có bị quá tải**:
   ```bash
   # Xem processes
   ps aux | grep ollama
   
   # Kiểm tra memory usage
   free -h
   ```

3. **Restart Ollama nếu cần**:
   ```bash
   # Kill ollama process
   pkill ollama
   
   # Start lại
   ollama serve
   ```

### Bước 3: Restart Engine

1. **Stop engine**:
   ```bash
   # Trong Convex Dashboard, chạy:
   testing:kick
   ```

2. **Wipe và khởi tạo lại**:
   ```bash
   # Wipe tất cả data
   testing:wipeAllTables
   
   # Resume engine
   testing:resume
   
   # Init với số agents ít hơn
   init({ numAgents: 5 })
   ```

### Bước 4: Kiểm tra Backend Logs

```bash
# Xem logs real-time
docker-compose logs -f backend

# Tìm errors
docker-compose logs backend | grep -i error

# Tìm timeout errors
docker-compose logs backend | grep -i timeout
```

## Giải pháp Dài hạn

### 1. Giảm số lượng Agents mặc định

Sửa file `convex/init.ts`:

```typescript
// Thay đổi từ:
const toCreate = args.numAgents !== undefined ? args.numAgents : Descriptions.length;

// Thành:
const toCreate = args.numAgents !== undefined ? args.numAgents : 5; // Chỉ tạo 5 agents mặc định
```

### 2. Tăng Timeout cho Engine Actions

Nếu cần xử lý nhiều agents, có thể tăng `ENGINE_ACTION_DURATION`:

File `convex/constants.ts`:
```typescript
// Tăng từ 30s lên 60s
export const ENGINE_ACTION_DURATION = 60000;
```

**Lưu ý**: Điều này chỉ giúp engine có thêm thời gian xử lý, nhưng không giải quyết vấn đề quá tải.

### 3. Giảm Frequency của Agent Actions

Có thể tăng các timeout để agents hoạt động ít thường xuyên hơn:

File `convex/constants.ts`:
```typescript
// Tăng cooldown times
export const CONVERSATION_COOLDOWN = 30000; // Từ 15s lên 30s
export const ACTIVITY_COOLDOWN = 20_000; // Từ 10s lên 20s
export const AGENT_WAKEUP_THRESHOLD = 2000; // Từ 1s lên 2s
```

### 4. Tối ưu Ollama

1. **Sử dụng model nhỏ hơn** nếu có thể
2. **Giới hạn số lượng concurrent requests** đến Ollama
3. **Sử dụng Ollama với GPU** nếu có để tăng tốc độ

## Kiểm tra Performance

### 1. Monitor CPU và Memory

```bash
# Xem CPU và Memory usage
htop

# Hoặc
top
```

### 2. Kiểm tra số lượng Agents

```bash
# Trong Convex Dashboard, query:
# Table: worlds
# Đếm số agents trong field "agents"
```

### 3. Kiểm tra Engine Status

```bash
# Trong Convex Dashboard, query:
# Table: engines
# Kiểm tra:
# - currentTime có được cập nhật không?
# - running có là true không?
# - generationNumber có tăng không?
```

### 4. Kiểm tra Inputs Queue

```bash
# Trong Convex Dashboard, query:
# Table: inputs
# Đếm số inputs chưa được xử lý (returnValue === undefined)
```

## Troubleshooting

### Nếu vẫn timeout sau khi giảm agents:

1. **Kiểm tra Ollama**:
   - Ollama có đang chạy không?
   - Ollama có bị quá tải không?
   - Model có được load đúng không?

2. **Kiểm tra Network**:
   - Backend có thể kết nối đến Ollama không?
   - `OLLAMA_HOST` có đúng không?

3. **Kiểm tra Engine**:
   - Engine có đang chạy không? (`testing:resume`)
   - Engine có bị stuck không? (`testing:kick`)

### Nếu CPU vẫn cao:

1. **Giảm số agents xuống còn 2-3 agents** để test
2. **Kiểm tra có process nào khác đang chiếm CPU không**
3. **Restart tất cả services**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Nếu Memory vẫn cao:

1. **Kiểm tra Ollama memory usage**
2. **Kiểm tra Convex backend memory usage**
3. **Restart services nếu cần**

## Best Practices

1. **Bắt đầu với ít agents** (2-5 agents) để test
2. **Tăng dần số agents** nếu performance tốt
3. **Monitor CPU và Memory** thường xuyên
4. **Sử dụng timeout** cho tất cả async operations
5. **Log errors** để debug dễ dàng hơn

## Quick Fix Script

Tạo file `quick-fix.sh`:

```bash
#!/bin/bash

echo "Stopping services..."
docker-compose stop backend

echo "Wiping all tables..."
# Chạy trong Convex Dashboard: testing:wipeAllTables

echo "Restarting services..."
docker-compose start backend

echo "Resuming engine..."
# Chạy trong Convex Dashboard: testing:resume

echo "Initializing with 5 agents..."
# Chạy trong Convex Dashboard: init({ numAgents: 5 })

echo "Done! Check Convex Dashboard for status."
```

## Liên hệ

Nếu vẫn gặp vấn đề sau khi thử tất cả các bước trên:
1. Thu thập logs: `docker-compose logs backend > backend.log`
2. Chụp screenshot của Convex Dashboard (tables: worlds, engines, inputs)
3. Ghi lại CPU/Memory usage từ `htop`
4. Mô tả chi tiết các bước đã thực hiện

