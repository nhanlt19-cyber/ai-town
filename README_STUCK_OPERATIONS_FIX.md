# Giải pháp Sửa Lỗi Stuck Agent Operations

## Vấn đề

Các agents đang trong trạng thái `inProgressOperation` nhưng operations không hoàn thành, gây ra:
- Agents không thể thực hiện hành động mới
- Engine bị quá tải
- Timeout errors khi tương tác với agents
- CPU và Memory cao

## Phân tích dữ liệu của bạn

Từ dữ liệu bạn cung cấp:
- **4 agents** đang trong `agentGenerateMessage` operation
- **1 agent** đang trong `agentDoSomething` operation
- Tất cả operations đã chạy quá **9.3 phút** (557 giây)
- `ACTION_TIMEOUT` = 120 giây (2 phút)
- **Operations đã timeout** nhưng chưa được reset

## Nguyên nhân

1. **LLM calls bị timeout**: Ollama có thể bị quá tải hoặc chậm, khiến `agentGenerateMessage` không hoàn thành
2. **Engine không chạy thường xuyên**: Engine có thể không tick đủ nhanh để detect và timeout operations
3. **Operations bị stuck**: Operations có thể bị stuck trong queue và không bao giờ hoàn thành

## Giải pháp đã thực hiện

### 1. Tạo function `resetStuckOperations`

File `convex/testing.ts` đã được thêm function mới:
- Tự động tìm các agents có `inProgressOperation` đã timeout (> 120 giây)
- Reset các operations này bằng cách xóa `inProgressOperation`
- Cho phép agents tiếp tục hoạt động bình thường

## Cách sử dụng

### Bước 1: Reset Stuck Operations

Trong Convex Dashboard (`http://10.0.12.81:3211`):

1. **Chạy function `resetStuckOperations`**:
   ```
   testing:resetStuckOperations
   ```

2. **Kiểm tra kết quả**:
   - Function sẽ trả về số lượng operations đã reset
   - Ví dụ: `{ resetCount: 5, message: "Reset 5 stuck operation(s)" }`

### Bước 2: Kick Engine (Khuyến nghị)

Sau khi reset operations, nên kick engine để đảm bảo mọi thứ hoạt động:

```
testing:kick
```

### Bước 3: Kiểm tra lại

1. **Refresh frontend**
2. **Kiểm tra agents có hoạt động không**
3. **Thử tương tác với agent**: "how are you today?"

## Giải pháp Dài hạn

### 1. Giảm số lượng Agents

Các operations bị stuck thường do quá nhiều agents cùng gọi Ollama:

```bash
# Wipe và tạo lại với ít agents hơn
testing:wipeAllTables
testing:resume
init({ numAgents: 3 })
```

### 2. Tăng ACTION_TIMEOUT (nếu cần)

Nếu Ollama chậm, có thể tăng timeout:

File `convex/constants.ts`:
```typescript
export const ACTION_TIMEOUT = 180_000; // Tăng từ 120s lên 180s
```

**Lưu ý**: Điều này chỉ giúp agents có thêm thời gian, nhưng không giải quyết vấn đề quá tải.

### 3. Kiểm tra Ollama

Đảm bảo Ollama hoạt động tốt:

```bash
# Kiểm tra Ollama
curl http://10.0.12.81:11434/api/tags

# Kiểm tra processes
ps aux | grep ollama

# Restart nếu cần
pkill ollama
ollama serve
```

## Troubleshooting

### Nếu `resetStuckOperations` không hoạt động:

1. **Kiểm tra worldStatus**:
   - Đảm bảo có default world
   - Đảm bảo world status là "running"

2. **Kiểm tra logs**:
   ```bash
   docker-compose logs backend | grep -i "reset\|stuck\|timeout"
   ```

3. **Thử kick engine trước**:
   ```
   testing:kick
   ```

### Nếu operations tiếp tục bị stuck:

1. **Giảm số agents xuống 2-3**:
   ```
   testing:wipeAllTables
   testing:resume
   init({ numAgents: 2 })
   ```

2. **Kiểm tra Ollama performance**:
   - Ollama có đang chạy không?
   - Model có được load đúng không?
   - Có đủ memory không?

3. **Kiểm tra network**:
   - Backend có thể kết nối đến Ollama không?
   - `OLLAMA_HOST` có đúng không?

## Best Practices

1. **Monitor operations thường xuyên**:
   - Kiểm tra `worlds.agents[].inProgressOperation` trong Dashboard
   - Nếu thấy operations > 2 phút, chạy `resetStuckOperations`

2. **Giảm số agents**:
   - Bắt đầu với 2-3 agents để test
   - Tăng dần nếu performance tốt

3. **Kiểm tra Ollama**:
   - Đảm bảo Ollama đang chạy
   - Monitor Ollama memory usage
   - Restart Ollama nếu cần

4. **Sử dụng `testing:kick`**:
   - Kick engine thường xuyên để reset state
   - Đặc biệt sau khi reset stuck operations

## Quick Fix Script

Nếu gặp vấn đề này thường xuyên:

```bash
# 1. Reset stuck operations
# Trong Dashboard: testing:resetStuckOperations

# 2. Kick engine
# Trong Dashboard: testing:kick

# 3. Kiểm tra logs
docker-compose logs -f backend | grep -i "reset\|timeout"
```

## Liên hệ

Nếu vẫn gặp vấn đề:
1. Thu thập logs: `docker-compose logs backend > backend.log`
2. Chụp screenshot Convex Dashboard (table: worlds, agents field)
3. Ghi lại số lượng agents và operations bị stuck
4. Mô tả các bước đã thực hiện

