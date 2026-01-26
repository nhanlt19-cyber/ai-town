# Giải pháp Sửa Lỗi "World for engine ... not found"

## Vấn đề

Khi tương tác với agent (ví dụ: "how are you today?"), gặp lỗi:
```
Uncaught Error: World for engine m17faea0bezqdabzz0v23nraeh7z9ywm not found
    at insertInput (../../convex/aiTown/insertInput.ts:17:2)
    at async handler (../../convex/aiTown/agent.ts:325:70)
```

## Nguyên nhân

Lỗi này xảy ra khi:
1. **worldStatus bị thiếu**: `worldStatus` record không tồn tại trong database cho `worldId` đó
2. **Data inconsistency**: World tồn tại nhưng `worldStatus` bị xóa hoặc chưa được tạo
3. **Index không hoạt động**: Index `worldId` trên table `worldStatus` có vấn đề

## Giải pháp đã thực hiện

File `convex/aiTown/insertInput.ts` đã được cải thiện:
1. **Fallback query**: Nếu không tìm thấy bằng index, sẽ thử tìm bằng filter
2. **Kiểm tra world tồn tại**: Xác minh world có tồn tại không trước khi báo lỗi
3. **Tìm bằng isDefault**: Nếu là default world, thử tìm bằng `isDefault: true`
4. **Error messages rõ ràng**: Đưa ra hướng dẫn cụ thể để fix

## Cách Khắc phục Ngay lập tức

### Bước 1: Kiểm tra Database

1. **Vào Convex Dashboard**: `http://10.0.12.81:3211`
2. **Kiểm tra table `worldStatus`**:
   - Xem có record nào không?
   - Nếu có, kiểm tra `worldId` có khớp với world đang dùng không?
   - Kiểm tra `isDefault` có là `true` không?

3. **Kiểm tra table `worlds`**:
   - Xem có world nào không?
   - Lấy `_id` của world

4. **So sánh**:
   - `worldStatus.worldId` có khớp với `worlds._id` không?

### Bước 2: Tạo lại worldStatus (nếu thiếu)

Nếu `worldStatus` bị thiếu nhưng `world` vẫn tồn tại:

**Option 1: Wipe và tạo lại (Khuyến nghị)**
```bash
# Trong Convex Dashboard:
1. Chạy: testing:wipeAllTables
2. Chạy: testing:resume
3. Chạy: init({ numAgents: 3 })
```

**Option 2: Tạo lại worldStatus thủ công (Nâng cao)**
```javascript
// Trong Convex Dashboard, chạy mutation này:
// Lưu ý: Cần biết worldId và engineId

// 1. Tìm worldId từ table worlds
// 2. Tạo engine mới hoặc tìm engineId hiện có
// 3. Tạo worldStatus:
await ctx.db.insert('worldStatus', {
  worldId: 'YOUR_WORLD_ID',
  engineId: 'YOUR_ENGINE_ID',
  isDefault: true,
  lastViewed: Date.now(),
  status: 'running',
});
```

### Bước 3: Kiểm tra Index

Nếu `worldStatus` tồn tại nhưng vẫn không tìm thấy:

1. **Kiểm tra index `worldId`**:
   - Vào Convex Dashboard
   - Xem table `worldStatus`
   - Kiểm tra index `worldId` có hoạt động không

2. **Rebuild index** (nếu cần):
   - Convex tự động rebuild index, nhưng có thể cần đợi vài giây
   - Hoặc wipe và tạo lại

## Giải pháp Dài hạn

### 1. Thêm Validation

Đảm bảo `worldStatus` luôn được tạo cùng với `world`:
- File `convex/init.ts` đã làm điều này
- Nhưng nếu có code khác tạo world, cần đảm bảo cũng tạo worldStatus

### 2. Thêm Auto-recovery

Code đã được cải thiện để:
- Tìm worldStatus bằng nhiều cách (index, filter, isDefault)
- Đưa ra error messages rõ ràng
- Gợi ý cách fix

### 3. Monitoring

Thêm logging để detect sớm:
```typescript
// Trong insertInput, đã có logging
console.error(`WorldStatus not found for world ${worldId}`);
```

## Troubleshooting

### Nếu vẫn gặp lỗi sau khi fix:

1. **Kiểm tra logs**:
   ```bash
   docker-compose logs backend | grep -i "worldstatus\|world"
   ```

2. **Kiểm tra có nhiều worlds không**:
   - Có thể có nhiều worlds nhưng chỉ có 1 worldStatus
   - Cần đảm bảo mỗi world có 1 worldStatus

3. **Kiểm tra race condition**:
   - Có thể worldStatus chưa được tạo xong khi agent operation chạy
   - Code đã có fallback nhưng có thể cần thêm retry logic

### Nếu worldStatus bị xóa thường xuyên:

1. **Kiểm tra có code nào xóa worldStatus không**:
   ```bash
   grep -r "worldStatus.*delete\|delete.*worldStatus" convex/
   ```

2. **Kiểm tra testing functions**:
   - `testing:wipeAllTables` sẽ xóa tất cả, đây là expected behavior
   - Nhưng nếu worldStatus bị xóa mà không chạy wipe, có thể là bug

## Best Practices

1. **Luôn tạo worldStatus cùng với world**:
   - Sử dụng `getOrCreateDefaultWorld` trong `init.ts` làm reference

2. **Không xóa worldStatus trực tiếp**:
   - Nếu cần reset, dùng `testing:wipeAllTables`

3. **Kiểm tra worldStatus trước khi dùng**:
   - Code đã làm điều này, nhưng nếu viết code mới, nhớ check

4. **Sử dụng index đúng cách**:
   - Luôn query bằng index nếu có thể
   - Có fallback bằng filter nếu index fail

## Quick Fix Script

Nếu gặp lỗi này thường xuyên, có thể tạo một function để auto-fix:

```typescript
// Trong convex/testing.ts hoặc tạo file mới
export const fixWorldStatus = mutation({
  handler: async (ctx) => {
    // Tìm default world
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    
    if (worldStatus) {
      console.log(`WorldStatus exists: ${worldStatus._id}`);
      return { fixed: false, worldStatusId: worldStatus._id };
    }
    
    // Tìm world
    const worlds = await ctx.db.query('worlds').collect();
    if (worlds.length === 0) {
      throw new Error('No worlds found. Run init() first.');
    }
    
    // Tạo engine và worldStatus
    const engineId = await createEngine(ctx);
    const worldId = worlds[0]._id; // Hoặc tìm default world
    
    const newWorldStatusId = await ctx.db.insert('worldStatus', {
      worldId,
      engineId,
      isDefault: true,
      lastViewed: Date.now(),
      status: 'running',
    });
    
    console.log(`Created worldStatus: ${newWorldStatusId}`);
    return { fixed: true, worldStatusId: newWorldStatusId };
  },
});
```

## Liên hệ

Nếu vẫn gặp vấn đề:
1. Thu thập logs: `docker-compose logs backend > backend.log`
2. Chụp screenshot Convex Dashboard (tables: worlds, worldStatus, engines)
3. Ghi lại worldId gây lỗi
4. Mô tả các bước đã thực hiện

