# Hướng dẫn Debug và Sử dụng Chức năng Interact

## Tổng quan

Chức năng **Interact** cho phép bạn tham gia vào simulation như một human player, có thể di chuyển và trò chuyện với các agent trong AI Town.

## Cách sử dụng

1. **Mở frontend**: Truy cập `http://10.0.12.81:5173` (hoặc URL ngrok nếu bạn đang dùng)
2. **Đợi game load**: Đảm bảo `worldStatus` là "running" và có agents hiển thị trên map
3. **Click nút "Interact"**: Nút này nằm ở góc trên bên phải của màn hình
4. **Chờ join hoàn tất**: Bạn sẽ thấy text "Joining..." trong vài giây
5. **Nhân vật của bạn xuất hiện**: Một nhân vật với vòng tròn highlight sẽ xuất hiện trên map
6. **Di chuyển**: Click vào map để di chuyển nhân vật của bạn
7. **Trò chuyện**: Click vào một agent, sau đó click "Start conversation" để bắt đầu trò chuyện

## Các vấn đề thường gặp và cách sửa

### 1. Nút "Interact" không hoạt động / không có phản hồi

**Nguyên nhân có thể:**
- Game chưa load xong (`game === undefined`)
- `worldId` chưa có (`worldStatus` chưa được tạo)
- Engine chưa active

**Cách kiểm tra:**
1. Mở **Browser Console** (F12)
2. Click nút "Interact"
3. Xem log trong console, bạn sẽ thấy:
   ```
   joinOrLeaveGame called {
     worldId: "...",
     game: true/false,
     isPlaying: true/false,
     isJoining: true/false,
     humanTokenIdentifier: "Me",
     userPlayerId: "..."
   }
   ```

**Cách sửa:**
- Nếu `worldId` là `null` hoặc `undefined`:
  - Chạy function `init` trong Convex Dashboard
  - Đảm bảo `worldStatus` đã được tạo với `isDefault: true`
  
- Nếu `game: false`:
  - Đợi thêm vài giây để game load
  - Kiểm tra backend logs: `docker-compose logs backend`
  - Đảm bảo engine đang chạy: Chạy `testing:resume` trong Dashboard

### 2. Click "Interact" nhưng không có gì xảy ra

**Nguyên nhân:**
- Button bị disable do `isJoining = true` hoặc `game === undefined`
- Mutation `joinWorld` bị lỗi nhưng không hiển thị error

**Cách kiểm tra:**
1. Mở Browser Console (F12)
2. Click "Interact"
3. Tìm các log:
   - `Calling joinWorld mutation for world ...`
   - `Join mutation returned inputId: ...`
   - `Waiting for input ... to complete...`
   - `Input ... completed successfully`

**Cách sửa:**
- Nếu không thấy log "Calling joinWorld mutation":
  - Kiểm tra xem button có bị disable không (hover vào button, xem tooltip)
  - Kiểm tra console có error không
  
- Nếu thấy error "Join error: ...":
  - Error message sẽ hiển thị trong toast notification
  - Các lỗi phổ biến:
    - `"You are already in this game!"` → Bạn đã join rồi, refresh page
    - `"Only 8 human players allowed at once"` → Đã đủ 8 người chơi
    - `"Invalid world ID"` → World không tồn tại, chạy lại `init`

### 3. Join thành công nhưng không thấy nhân vật trên map

**Nguyên nhân:**
- Game state chưa được cập nhật sau khi join
- `humanTokenIdentifier` không khớp với player trong game
- Player được tạo nhưng không render

**Cách kiểm tra:**
1. Mở Browser Console
2. Sau khi join, kiểm tra:
   ```javascript
   // Trong console, bạn có thể inspect:
   // - humanTokenIdentifier phải là "Me"
   // - userPlayerId phải có giá trị
   // - game.world.players phải chứa player với human === "Me"
   ```

3. Kiểm tra trong Convex Dashboard:
   - Vào table `worlds`
   - Tìm world của bạn
   - Kiểm tra field `players` có chứa player với `human: "Me"` không

**Cách sửa:**
- Refresh page (F5) sau khi join thành công
- Kiểm tra `DEFAULT_NAME` trong `convex/constants.ts` phải là `'Me'`
- Đảm bảo `userStatus` query trả về `'Me'` (không phải `null`)

### 4. Lỗi "Input ... was never processed"

**Nguyên nhân:**
- Engine không xử lý input
- Engine bị crash hoặc dừng
- Input bị timeout

**Cách kiểm tra:**
1. Kiểm tra engine status trong Convex Dashboard:
   - Vào table `engines`
   - Tìm engine của world
   - Kiểm tra `currentTime` có được cập nhật không

2. Kiểm tra backend logs:
   ```bash
   docker-compose logs backend | grep -i error
   ```

**Cách sửa:**
- Restart engine: Chạy `testing:kick` trong Dashboard
- Resume engine: Chạy `testing:resume` trong Dashboard
- Kiểm tra Ollama đang chạy: `curl http://10.0.12.81:11434/api/tags`

### 5. Không thể di chuyển sau khi join

**Nguyên nhân:**
- `humanPlayerId` không được tìm thấy
- `moveTo` mutation bị lỗi
- Click event không được xử lý

**Cách kiểm tra:**
1. Mở Browser Console
2. Click vào map
3. Tìm log: `Moving to {"x":..., "y":...}`
4. Nếu không thấy log này, có thể `humanPlayerId` là `undefined`

**Cách sửa:**
- Đảm bảo bạn đã join thành công (nút hiển thị "Leave" thay vì "Interact")
- Refresh page và join lại
- Kiểm tra `PixiGame.tsx` component có nhận được `humanPlayerId` không

## Debug chi tiết

### Kiểm tra state trong Browser Console

Sau khi mở frontend, bạn có thể inspect state bằng cách:

1. Mở React DevTools (nếu có)
2. Hoặc thêm temporary console.log trong code
3. Hoặc sử dụng Convex Dashboard để xem database state

### Kiểm tra Convex Database

1. Vào Convex Dashboard: `http://10.0.12.81:3211`
2. Kiểm tra các table:
   - **`worldStatus`**: Đảm bảo có record với `isDefault: true` và `status: "running"`
   - **`worlds`**: Kiểm tra `players` array có chứa player với `human: "Me"`
   - **`engines`**: Kiểm tra `currentTime` có được cập nhật không
   - **`inputs`**: Xem các input mới nhất, kiểm tra `returnValue` có `null` không

### Kiểm tra Backend Logs

```bash
# Xem logs real-time
docker-compose logs -f backend

# Tìm errors
docker-compose logs backend | grep -i error

# Kiểm tra joinWorld mutation
docker-compose logs backend | grep -i "join"
```

### Kiểm tra Frontend Logs

Mở Browser Console (F12) và xem:
- Network tab: Kiểm tra các request đến Convex API
- Console tab: Xem các log và errors
- Application tab: Kiểm tra localStorage, sessionStorage

## Các thay đổi đã thực hiện

File `src/components/buttons/InteractButton.tsx` đã được cải thiện với:

1. **State management tốt hơn**:
   - Thêm `isJoining` state để tránh double-click
   - Kiểm tra `humanTokenIdentifier` trước khi tìm player

2. **Error handling tốt hơn**:
   - Log chi tiết mỗi bước
   - Hiển thị error messages rõ ràng
   - Toast notifications cho user

3. **UI feedback**:
   - Button text thay đổi: "Interact" → "Joining..." → "Leave"
   - Tooltip khi button bị disable
   - Console logs để debug

4. **Dependency array đúng**:
   - Sửa `useCallback` dependency array
   - Tránh infinite loops

## Checklist khi gặp vấn đề

- [ ] World status là "running"?
- [ ] Engine đang active? (chạy `testing:resume` nếu cần)
- [ ] Ollama đang chạy? (`curl http://10.0.12.81:11434/api/tags`)
- [ ] Backend container healthy? (`docker-compose ps`)
- [ ] Frontend container healthy? (`docker-compose ps`)
- [ ] Browser console có errors không?
- [ ] Convex Dashboard có errors không?
- [ ] Đã chạy `init` function chưa?
- [ ] `DEFAULT_NAME` là `'Me'`?
- [ ] `userStatus` query trả về `'Me'`?

## Liên hệ và hỗ trợ

Nếu vẫn gặp vấn đề sau khi thử các bước trên:
1. Thu thập logs từ browser console
2. Thu thập logs từ backend: `docker-compose logs backend > backend.log`
3. Chụp screenshot của Convex Dashboard (tables: worlds, engines, worldStatus)
4. Mô tả chi tiết các bước đã thực hiện

