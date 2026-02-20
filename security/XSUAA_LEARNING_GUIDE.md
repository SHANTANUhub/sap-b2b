# 🎓 XSUAA Learning Guide - Step by Step

## 📖 What is XSUAA?

**XSUAA (Extended Services for UAA)** is SAP's authorization and authentication service on BTP (Business Technology Platform). It secures your applications by:
- Authenticating users (verifying who they are)
- Authorizing access (controlling what they can do)

---

## 🏗️ Building Blocks of XSUAA

### 1️⃣ **Scopes** - The Basic Permissions

**What are they?**
- The smallest unit of permission
- Define WHAT action can be performed
- Example: Read, Write, Delete, Admin

**Naming Convention:**
```
$XSAPPNAME.ScopeName
```
- `$XSAPPNAME` is automatically replaced with your app name
- Ensures scopes are unique across the platform

**Example in your xs-security.json:**
```json
{
  "name": "$XSAPPNAME.Read",
  "description": "Permission to read data"
}
```

---

### 2️⃣ **Attributes** - Dynamic Access Control

**What are they?**
- User-specific properties
- Used for fine-grained access control
- Values are assigned to users in BTP Cockpit

**Common Use Cases:**
- Department-based access
- Cost center filtering
- Region-specific data access
- Customer/vendor assignments

**Example:**
```json
{
  "name": "Department",
  "description": "User's department",
  "valueType": "string"
}
```

**How to use in your app:**
```javascript
// In CAP service (service.js)
req.user.attr.Department // Returns ['Sales', 'Marketing']
```

---

### 3️⃣ **Role Templates** - Bundling Permissions

**What are they?**
- Collections of scopes and attributes
- Define permission sets for different user types
- Building blocks for Role Collections

**Structure:**
```json
{
  "name": "RoleName",
  "description": "What this role can do",
  "scope-references": ["list", "of", "scopes"],
  "attribute-references": ["list", "of", "attributes"]
}
```

**Example Hierarchy:**
- **Viewer** → Read only
- **Editor** → Read + Write
- **Manager** → Read + Write + Delete
- **Administrator** → All permissions

---

## 🎯 Your Current Setup Explained

### Scopes Defined:
1. ✅ **Read** - Basic read access
2. ✅ **Write** - Create/modify data
3. ✅ **Delete** - Delete data
4. ✅ **Admin** - Administrative functions

### Attributes Defined:
1. ✅ **Department** - For department-based filtering
2. ✅ **CostCenter** - For cost tracking

### Roles Defined:
1. ✅ **Viewer** - Can only read data
2. ✅ **Editor** - Can read and write
3. ✅ **Manager** - Full CRUD operations
4. ✅ **Administrator** - Everything including admin tasks

---

## 🚀 Next Steps - How to Use XSUAA

### Step 1: Deploy the Security Configuration

```bash
cf create-service xsuaa application security-xsuaa -c xs-security.json
```

### Step 2: Bind to Your Application

In your `mta.yaml`, add:
```yaml
resources:
  - name: security-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: ./xs-security.json
```

Then bind it to your modules:
```yaml
modules:
  - name: security-srv
    requires:
      - name: security-xsuaa
```

### Step 3: Use in CAP Service (.cds file)

Create restrictions in your service definition:

```cds
// srv/cat-service.cds
using { sap.capire.bookshop as db } from '../db/schema';

service CatalogService @(requires: 'authenticated-user') {
  
  entity Books @(restrict: [
    {
      grant: 'READ',
      to: 'Viewer'
    },
    {
      grant: ['READ', 'WRITE'],
      to: 'Editor'
    },
    {
      grant: '*',  // All operations
      to: 'Administrator'
    }
  ]) as projection on db.Books;
  
}
```

### Step 4: Use in Service Implementation (.js file)

```javascript
// srv/service.js
module.exports = (srv) => {
  
  // Check if user has specific scope
  srv.before('*', req => {
    if (!req.user.is('Editor')) {
      req.reject(403, 'You need Editor role');
    }
  });
  
  // Access user attributes
  srv.before('READ', 'Books', req => {
    const userDept = req.user.attr.Department;
    console.log('User department:', userDept);
    
    // Filter data based on department
    if (userDept) {
      req.query.where({ department: { in: userDept } });
    }
  });
  
  // Check for Admin scope
  srv.on('deleteAll', req => {
    if (!req.user.is('Administrator')) {
      req.reject(403, 'Admin access required');
    }
    // Perform admin operation
  });
  
}
```

### Step 5: Create Role Collections in BTP Cockpit

1. Go to **BTP Cockpit** → Your Subaccount
2. Navigate to **Security** → **Role Collections**
3. Click **Create New Role Collection**
4. Add your role templates (Viewer, Editor, Manager, Administrator)
5. Assign users/user groups to role collections

---

## 🧪 Testing Authorization

### Test with CAP Mock Users

Create `tests/.cdsrc.json`:
```json
{
  "auth": {
    "passport": {
      "strategy": "mock",
      "users": {
        "alice": {
          "roles": ["Viewer"],
          "attr": {
            "Department": ["Sales"]
          }
        },
        "bob": {
          "roles": ["Editor"],
          "attr": {
            "Department": ["Marketing"],
            "CostCenter": ["CC1000"]
          }
        },
        "admin": {
          "roles": ["Administrator"]
        }
      }
    }
  }
}
```

Test with:
```bash
cds watch --profile development

# Then test with:
# http://localhost:4004/catalog/Books?$auth=alice
# http://localhost:4004/catalog/Books?$auth=bob
```

---

## 📚 Advanced Topics

### 1. Grant Type: `authorization_code`
For UI applications that redirect to login page

### 2. Grant Type: `client_credentials`
For service-to-service communication

### 3. Authorities Inheritance
```json
"authorities-inheritance": true
```
Allows child accounts to inherit authorizations

### 4. Foreign Scope References
Reference scopes from other applications:
```json
{
  "name": "ForeignScope",
  "grant-as-authority-to-apps": [
    "$XSAPPNAME(application,otherapp)"
  ]
}
```

---

## 🎯 Common Patterns

### Pattern 1: Hierarchical Roles
```
Viewer ⊂ Editor ⊂ Manager ⊂ Administrator
```

### Pattern 2: Functional Roles
```
SalesRole, PurchaseRole, FinanceRole
```

### Pattern 3: Department-Based Access
Using attributes to filter data by department

### Pattern 4: Multi-Tenant Applications
```json
"tenant-mode": "shared"
```

---

## 🔍 Debugging Tips

1. **Check user scopes:**
   ```javascript
   console.log('User scopes:', req.user.scopes);
   console.log('User attributes:', req.user.attr);
   ```

2. **Test with different users:**
   ```bash
   cds watch --profile development
   # Access: http://localhost:4004/?$auth=username
   ```

3. **View JWT token:**
   Use browser DevTools → Network → Check Authorization header

4. **Common Issues:**
   - Role not showing → Check role template name matches
   - Permission denied → Verify scope is in role template
   - Attribute not working → Check value type and assignment

---

## 📖 Further Reading

- [SAP XSUAA Documentation](https://help.sap.com/xsuaa)
- [CAP Authorization Guide](https://cap.cloud.sap/docs/guides/authorization)
- [JWT Token Structure](https://jwt.io)

---

## ✅ Checklist

- [ ] Understand scopes, attributes, and role templates
- [ ] Review your xs-security.json configuration
- [ ] Create service restrictions in .cds files
- [ ] Implement authorization checks in .js files
- [ ] Test with mock users locally
- [ ] Deploy to BTP and create role collections
- [ ] Assign roles to users
- [ ] Test in production

---

**Happy Learning! 🚀**
