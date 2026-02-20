# 📝 XSUAA Quick Reference Cheat Sheet

## 🔑 Key Concepts in 30 Seconds

```
Authentication (Who are you?) → Login → JWT Token
Authorization (What can you do?) → Scopes + Roles → Access Control
```

---

## 📚 XSUAA Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **Scope** | Basic permission unit | `$XSAPPNAME.Read` |
| **Attribute** | User-specific property | `Department`, `CostCenter` |
| **Role Template** | Bundle of scopes | `Viewer`, `Editor`, `Manager` |
| **Role Collection** | Assigned to users in BTP | Created in BTP Cockpit |

---

## 🏗️ xs-security.json Structure

```json
{
  "xsappname": "my-app",
  "tenant-mode": "dedicated",
  
  "scopes": [
    {
      "name": "$XSAPPNAME.Read",
      "description": "Read permission"
    }
  ],
  
  "attributes": [
    {
      "name": "Department",
      "description": "User department",
      "valueType": "string"
    }
  ],
  
  "role-templates": [
    {
      "name": "Viewer",
      "description": "Read-only user",
      "scope-references": ["$XSAPPNAME.Read"],
      "attribute-references": ["Department"]
    }
  ]
}
```

---

## 🎯 Authorization in CAP (.cds)

### Service Level
```cds
service MyService @(requires: 'authenticated-user') {
  // All entities require authentication
}
```

### Entity Level
```cds
entity Orders @(restrict: [
  { grant: 'READ', to: 'Viewer' },
  { grant: ['READ', 'WRITE'], to: 'Editor' },
  { grant: '*', to: 'Admin' }
]) as projection on db.Orders;
```

### With Attribute Filtering
```cds
entity Orders @(restrict: [
  {
    grant: 'READ',
    to: 'Viewer',
    where: 'department = $user.Department'
  }
]) as projection on db.Orders;
```

### Action/Function Level
```cds
@(requires: 'Manager')
action approveOrder(orderID: UUID) returns String;
```

---

## 💻 Authorization in JavaScript (service.js)

### Check User Role
```javascript
// Method 1: Using is()
if (req.user.is('Administrator')) {
  // User has Administrator role
}

// Method 2: Check multiple roles
if (req.user.is('Manager') || req.user.is('Administrator')) {
  // User has Manager OR Administrator role
}

// Method 3: Check scopes directly
const hasWriteScope = req.user.scopes.includes('my-app.Write');
```

### Access User Attributes
```javascript
// Get user department(s)
const userDept = req.user.attr.Department;
// Returns: ['Sales', 'Marketing'] (array)

// Get cost center
const costCenter = req.user.attr.CostCenter;

// Filter query by user department
this.before('READ', 'Orders', req => {
  if (req.user.attr.Department) {
    req.query.where({ 
      department: { in: req.user.attr.Department } 
    });
  }
});
```

### Get User Information
```javascript
console.log('User ID:', req.user.id);
console.log('User Roles:', req.user.roles);
console.log('User Scopes:', req.user.scopes);
console.log('User Attributes:', req.user.attr);
console.log('Is Authenticated:', req.user.is('authenticated-user'));
```

### Reject with 403
```javascript
if (!req.user.is('Manager')) {
  req.reject(403, 'Insufficient privileges');
}
```

---

## 🧪 Testing Locally

### .cdsrc.json Configuration
```json
{
  "auth": {
    "passport": {
      "strategy": "mock",
      "users": {
        "alice": {
          "password": "password",
          "roles": ["Viewer"],
          "attr": {
            "Department": ["Sales"]
          }
        }
      }
    }
  }
}
```

### Test with Different Users
```bash
# Start app
cds watch

# Access with user
http://localhost:4004/service/Entity?$auth=alice
```

---

## 🚀 Common Patterns

### Pattern 1: Hierarchical Roles
```javascript
// Viewer ⊂ Editor ⊂ Manager ⊂ Administrator

const canWrite = req.user.is('Editor') || 
                 req.user.is('Manager') || 
                 req.user.is('Administrator');
```

### Pattern 2: Auto-Assign User Data
```javascript
this.before('CREATE', 'Orders', req => {
  // Auto-assign department from user
  if (req.user.attr.Department) {
    req.data.department = req.user.attr.Department[0];
  }
  
  // Auto-assign created by
  req.data.createdBy = req.user.id;
});
```

### Pattern 3: Audit Logging
```javascript
this.after('*', 'Orders', (data, req) => {
  console.log(`${req.user.id} performed ${req.event} on Orders`);
});
```

### Pattern 4: Department-Based Access
```cds
entity Orders @(restrict: [
  {
    grant: 'READ',
    to: 'User',
    where: 'department = $user.Department'
  }
])
```

---

## 🔍 Common Authorization Checks

```javascript
module.exports = cds.service.impl(function() {
  
  // 1. Ensure authenticated
  this.before('*', req => {
    if (!req.user.is('authenticated-user')) {
      req.reject(401, 'Authentication required');
    }
  });
  
  // 2. Check specific role
  this.before('DELETE', 'Orders', req => {
    if (!req.user.is('Manager')) {
      req.reject(403, 'Manager role required');
    }
  });
  
  // 3. Check scope
  this.before('UPDATE', 'Orders', req => {
    if (!req.user.scopes.includes('app.Write')) {
      req.reject(403, 'Write scope required');
    }
  });
  
  // 4. Check attribute
  this.before('READ', 'Orders', req => {
    const dept = req.user.attr.Department;
    if (!dept || dept.length === 0) {
      req.reject(403, 'No department assigned');
    }
  });
  
  // 5. Conditional logic
  this.before('UPDATE', 'Orders', async req => {
    const order = await SELECT.one.from('Orders')
      .where({ ID: req.data.ID });
    
    if (order.amount > 10000 && !req.user.is('Manager')) {
      req.reject(403, 'Manager approval required for high-value orders');
    }
  });
  
});
```

---

## 📦 Deployment Commands

### Create XSUAA Service
```bash
cf create-service xsuaa application my-xsuaa -c xs-security.json
```

### Update XSUAA Service
```bash
cf update-service my-xsuaa -c xs-security.json
```

### Bind to App
```bash
cf bind-service my-app my-xsuaa
cf restage my-app
```

---

## 🎨 BTP Cockpit - Role Collections

### Steps to Create Role Collection:
1. BTP Cockpit → Subaccount
2. Security → Role Collections
3. Create New Role Collection
4. Add Role Templates from your app
5. Assign Users/Groups

### Example Role Collection:
```
Name: SalesManager
Description: Sales department manager
Role Templates:
  - security-app-Manager (from security-app)
Attributes:
  - Department = Sales
  - CostCenter = CC-100
Users:
  - john.doe@company.com
  - jane.smith@company.com
```

---

## ⚡ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Check user has required role in .cdsrc.json |
| Role not found | Verify role name matches xs-security.json |
| Attribute empty | Check attribute assignment in BTP/mock config |
| All users blocked | Check service-level `@requires` annotation |
| Department filter not working | Ensure `where` clause uses `$user.AttributeName` |

---

## ✅ Authorization Best Practices

1. ✅ **Principle of Least Privilege** - Give minimum required permissions
2. ✅ **Use Role Templates** - Don't assign scopes directly
3. ✅ **Consistent Naming** - Use clear, descriptive names
4. ✅ **Document Roles** - Add descriptions in xs-security.json
5. ✅ **Test Locally** - Use .cdsrc.json for mock users
6. ✅ **Audit Access** - Log who does what
7. ✅ **Use Attributes** - For department/region-based access
8. ✅ **Validate in Code** - Don't rely only on declarative auth
9. ✅ **Handle Errors** - Provide clear error messages
10. ✅ **Regular Reviews** - Audit roles and permissions

---

## 📊 Authorization Decision Tree

```
Is user authenticated?
  ├─ NO → 401 Unauthorized
  └─ YES
      ├─ Has required role?
      │   ├─ NO → 403 Forbidden
      │   └─ YES
      │       ├─ Has required scope?
      │       │   ├─ NO → 403 Forbidden
      │       │   └─ YES
      │       │       ├─ Matches attribute filter?
      │       │       │   ├─ NO → Empty result set
      │       │       │   └─ YES
      │       │       │       └─ ✅ GRANT ACCESS
```

---

## 🔗 Useful Links

- [CAP Authorization Guide](https://cap.cloud.sap/docs/guides/authorization)
- [XSUAA Documentation](https://help.sap.com/xsuaa)
- [JWT Debugger](https://jwt.io)
- [BTP Security Best Practices](https://help.sap.com/btp/security)

---

**Keep this handy while developing! 🚀**
