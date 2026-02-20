# 🧪 Testing XSUAA Authorization

This guide shows you how to test your XSUAA configuration locally.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
cds watch
```

### 3. Test with Different Users

The application will run on `http://localhost:4004`

## 👥 Test Users

We have 5 test users configured in `.cdsrc.json`:

### 1. **alice** - Viewer 👁️
- **Role:** Viewer (Read-only)
- **Department:** Sales
- **Can:**
  - ✅ View orders in Sales department
- **Cannot:**
  - ❌ Create or modify orders
  - ❌ Delete orders
  - ❌ View orders from other departments

**Test URLs:**
```
http://localhost:4004/security/Orders?$auth=alice
http://localhost:4004/security/Orders?$auth=alice&sap-language=en
```

---

### 2. **bob** - Editor ✏️
- **Role:** Editor (Read + Write)
- **Department:** Marketing
- **Cost Center:** CC-200
- **Can:**
  - ✅ View orders in Marketing department
  - ✅ Create new orders (auto-assigned to Marketing)
  - ✅ Update orders in Marketing department
- **Cannot:**
  - ❌ Delete orders
  - ❌ Complete orders (requires Manager)
  - ❌ Create orders over 5000

**Test URLs:**
```
http://localhost:4004/security/Orders?$auth=bob
```

---

### 3. **charlie** - Manager 👔
- **Role:** Manager (Read + Write + Delete)
- **Department:** IT
- **Cost Center:** CC-300
- **Can:**
  - ✅ View orders in IT department
  - ✅ Create and update orders
  - ✅ Delete orders
  - ✅ Complete orders
  - ✅ Approve orders (custom action)
  - ✅ View department statistics
- **Cannot:**
  - ❌ Access admin-only functions
  - ❌ Delete completed orders (requires Administrator)

**Test URLs:**
```
http://localhost:4004/security/Orders?$auth=charlie
http://localhost:4004/security/getDepartmentStats?department='IT'&$auth=charlie
```

---

### 4. **david** - Administrator 👑
- **Role:** Administrator (Full Access)
- **Can:**
  - ✅ View ALL orders (no department restriction)
  - ✅ Create, update, delete any order
  - ✅ Delete completed orders
  - ✅ Access AppConfig (admin-only entity)
  - ✅ Reset all orders (admin action)
  - ✅ All Manager capabilities

**Test URLs:**
```
http://localhost:4004/security/Orders?$auth=david
http://localhost:4004/security/AppConfig?$auth=david
```

---

### 5. **eve** - Multi-Department Manager 🌐
- **Role:** Manager
- **Departments:** Sales AND Marketing
- **Cost Centers:** CC-100, CC-200
- **Can:**
  - ✅ View orders from both Sales and Marketing
  - ✅ Manage orders in both departments
  - ✅ Demonstrates multi-value attributes

**Test URLs:**
```
http://localhost:4004/security/Orders?$auth=eve
```

---

## 🧪 Test Scenarios

### Scenario 1: Read Access Test

**As alice (Viewer):**
```bash
# Should see only Sales orders
curl "http://localhost:4004/security/Orders?$auth=alice"

# Response: Orders filtered to Sales department only
```

**As bob (Editor):**
```bash
# Should see only Marketing orders
curl "http://localhost:4004/security/Orders?$auth=bob"
```

---

### Scenario 2: Create Order Test

**As alice (Viewer):**
```bash
# Should FAIL - Viewers cannot create
curl -X POST "http://localhost:4004/security/Orders?$auth=alice" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"ORD-999","customer":"Test Corp","amount":1000}'

# Response: 403 Forbidden
```

**As bob (Editor):**
```bash
# Should SUCCEED - Auto-assigned to Marketing
curl -X POST "http://localhost:4004/security/Orders?$auth=bob" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"ORD-999","customer":"Test Corp","amount":1000}'

# Response: 201 Created (department = Marketing)
```

---

### Scenario 3: Update Order Test

**As bob (Editor) - Small Amount:**
```bash
# Should SUCCEED (amount < 5000)
curl -X PATCH "http://localhost:4004/security/Orders(ID)?$auth=bob" \
  -H "Content-Type: application/json" \
  -d '{"amount":3000}'
```

**As bob (Editor) - Large Amount:**
```bash
# Should FAIL (amount > 5000)
curl -X PATCH "http://localhost:4004/security/Orders(ID)?$auth=bob" \
  -H "Content-Type: application/json" \
  -d '{"amount":7000}'

# Response: 403 - Editors cannot work with orders over 5000
```

---

### Scenario 4: Delete Order Test

**As bob (Editor):**
```bash
# Should FAIL - Editors cannot delete
curl -X DELETE "http://localhost:4004/security/Orders(ID)?$auth=bob"

# Response: 403 Forbidden
```

**As charlie (Manager):**
```bash
# Should SUCCEED - Managers can delete
curl -X DELETE "http://localhost:4004/security/Orders(ID)?$auth=charlie"

# Response: 204 No Content
```

---

### Scenario 5: Custom Actions Test

**Approve Order (Manager/Admin only):**
```bash
# As charlie (Manager) - Should SUCCEED
curl -X POST "http://localhost:4004/security/approveOrder?$auth=charlie" \
  -H "Content-Type: application/json" \
  -d '{"orderID":"..."}'

# As bob (Editor) - Should FAIL
curl -X POST "http://localhost:4004/security/approveOrder?$auth=bob" \
  -H "Content-Type: application/json" \
  -d '{"orderID":"..."}'

# Response: 403 Forbidden
```

**Reset All Orders (Admin only):**
```bash
# As david (Administrator) - Should SUCCEED
curl -X POST "http://localhost:4004/security/resetAllOrders?$auth=david"

# As charlie (Manager) - Should FAIL
curl -X POST "http://localhost:4004/security/resetAllOrders?$auth=charlie"

# Response: 403 Forbidden
```

---

### Scenario 6: Department Statistics (Manager+ only)

```bash
# As charlie (Manager) - Should SUCCEED
curl "http://localhost:4004/security/getDepartmentStats?department='IT'&$auth=charlie"

# Response: {"totalOrders":5,"totalAmount":15000,"openOrders":3}

# As bob (Editor) - Should FAIL
curl "http://localhost:4004/security/getDepartmentStats?department='Marketing'&$auth=bob"

# Response: 403 Forbidden
```

---

### Scenario 7: Admin-Only Entity Access

```bash
# As david (Administrator) - Should SUCCEED
curl "http://localhost:4004/security/AppConfig?$auth=david"

# As charlie (Manager) - Should FAIL
curl "http://localhost:4004/security/AppConfig?$auth=charlie"

# Response: 403 Forbidden
```

---

## 🌐 Using the Fiori Preview

### Open Fiori Preview:
```
http://localhost:4004
```

### Switch Users:
Add `?$auth=username` to any URL:
- `?$auth=alice` - Test as Viewer
- `?$auth=bob` - Test as Editor
- `?$auth=charlie` - Test as Manager
- `$auth=david` - Test as Administrator

---

## 📊 Expected Results Matrix

| Action | alice (Viewer) | bob (Editor) | charlie (Manager) | david (Admin) |
|--------|---------------|--------------|-------------------|---------------|
| Read Orders | ✅ (Sales only) | ✅ (Marketing only) | ✅ (IT only) | ✅ (All) |
| Create Order | ❌ | ✅ | ✅ | ✅ |
| Update Order | ❌ | ✅ (restrict <5000) | ✅ | ✅ |
| Delete Order | ❌ | ❌ | ✅ (not Completed) | ✅ (All) |
| Complete Order | ❌ | ❌ | ✅ | ✅ |
| Approve Order | ❌ | ❌ | ✅ | ✅ |
| Dept Stats | ❌ | ❌ | ✅ | ✅ |
| Reset All | ❌ | ❌ | ❌ | ✅ |
| AppConfig | ❌ | ❌ | ❌ | ✅ |

---

## 🔍 Debugging Tips

### 1. Check Console Logs
When you create/update orders, check the terminal for user info:
```
========== XSUAA User Info ==========
User ID: bob
User Roles: [ 'Editor' ]
User Scopes: [ 'security-app.Read', 'security-app.Write' ]
User Attributes: { Department: [ 'Marketing' ], CostCenter: [ 'CC-200' ] }
====================================
```

### 2. View Network Tab
- Open Browser DevTools (F12)
- Go to Network tab
- Check request headers for `Authorization` header
- Check response status codes (200, 403, etc.)

### 3. Test API with Postman/Insomnia
Use the `$auth` parameter in query string for basic auth testing

### 4. Check Restrictions
If access is denied, verify:
- User has the required role
- User's department matches the order's department
- Operation is allowed for that role

---

## ✅ Testing Checklist

- [ ] Viewer can only read
- [ ] Editor can read and write (with limits)
- [ ] Manager can read, write, delete
- [ ] Administrator has full access
- [ ] Department filtering works correctly
- [ ] Cost center attributes are assigned
- [ ] Custom actions respect authorization
- [ ] Custom functions require correct roles
- [ ] Admin-only entities are protected
- [ ] Logging shows correct user info

---

## 🚀 Next Steps

1. ✅ Test all scenarios locally
2. ✅ Understand the authorization flow
3. ✅ Modify roles in xs-security.json
4. ✅ Add your own custom business rules
5. ✅ Deploy to BTP and configure real users
6. ✅ Create Role Collections in BTP Cockpit
7. ✅ Assign users to Role Collections

---

**Happy Testing! 🎉**
