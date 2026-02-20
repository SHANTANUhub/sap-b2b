const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { Orders } = this.entities;
  
  // ========================================
  // XSUAA Authorization Examples
  // ========================================
  
  /**
   * Example 1: Check user roles before processing
   */
  this.before('CREATE', 'Orders', async (req) => {
    console.log('========== XSUAA User Info ==========');
    console.log('User ID:', req.user.id);
    console.log('User Roles:', req.user.roles);
    console.log('User Scopes:', req.user.scopes);
    console.log('User Attributes:', req.user.attr);
    console.log('====================================');
    
    // Auto-assign department from user attributes
    if (req.user.attr.Department && req.user.attr.Department.length > 0) {
      req.data.department = req.user.attr.Department[0];
    }
    
    // Auto-assign cost center from user attributes
    if (req.user.attr.CostCenter && req.user.attr.CostCenter.length > 0) {
      req.data.costCenter = req.user.attr.CostCenter[0];
    }
  });
  
  /**
   * Example 2: Enforce business rules based on roles
   */
  this.before('UPDATE', 'Orders', async (req) => {
    const order = await SELECT.one.from(Orders).where({ ID: req.data.ID });
    
    if (!order) {
      return req.reject(404, 'Order not found');
    }
    
    // Only Managers and Administrators can change status to 'Completed'
    if (req.data.status === 'Completed') {
      if (!req.user.is('Manager') && !req.user.is('Administrator')) {
        return req.reject(403, 'Only Managers can complete orders');
      }
    }
    
    // Editors cannot update amount over 5000
    if (req.data.amount > 5000 && req.user.is('Editor')) {
      return req.reject(403, 'Editors cannot create orders over 5000. Contact a Manager.');
    }
  });
  
  /**
   * Example 3: Custom DELETE validation
   */
  this.before('DELETE', 'Orders', async (req) => {
    // Log who is deleting
    console.log(`User ${req.user.id} is deleting order ${req.params[0]}`);
    
    // Additional check: Don't allow deletion of completed orders
    const order = await SELECT.one.from(Orders).where({ ID: req.params[0] });
    
    if (order && order.status === 'Completed') {
      if (!req.user.is('Administrator')) {
        return req.reject(403, 'Cannot delete completed orders. Only Administrators can override.');
      }
    }
  });
  
  /**
   * Example 4: Custom Action - Approve Order
   * Only Managers and Administrators can approve
   */
  this.on('approveOrder', async (req) => {
    const { orderID } = req.data;
    
    // Double-check authorization (already enforced by @requires)
    if (!req.user.is('Manager') && !req.user.is('Administrator')) {
      return req.reject(403, 'Insufficient privileges to approve orders');
    }
    
    // Update order status
    const updated = await UPDATE(Orders)
      .set({ status: 'Approved' })
      .where({ ID: orderID });
    
    if (updated) {
      return `Order ${orderID} has been approved by ${req.user.id}`;
    } else {
      return req.reject(404, 'Order not found');
    }
  });
  
  /**
   * Example 5: Custom Action - Reset All Orders (Admin Only)
   */
  this.on('resetAllOrders', async (req) => {
    // This is admin-only operation
    console.log(`ADMIN ACTION: ${req.user.id} is resetting all orders`);
    
    const updated = await UPDATE(Orders).set({ status: 'Open' });
    
    return `Reset ${updated} orders to Open status`;
  });
  
  /**
   * Example 6: Custom Function - Get My Orders
   * Returns only orders for the user's department
   */
  this.on('getMyOrders', async (req) => {
    const userDept = req.user.attr.Department;
    
    if (!userDept || userDept.length === 0) {
      return [];
    }
    
    const orders = await SELECT.from(Orders)
      .where({ department: { in: userDept } })
      .orderBy('createdAt desc');
    
    return orders;
  });
  
  /**
   * Example 7: Custom Function - Get Department Statistics
   * Only for Managers and Administrators
   */
  this.on('getDepartmentStats', async (req) => {
    const { department } = req.data;
    
    const orders = await SELECT.from(Orders)
      .where({ department: department });
    
    const stats = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0),
      openOrders: orders.filter(o => o.status === 'Open').length
    };
    
    return stats;
  });
  
  /**
   * Example 8: After READ - Log access for audit
   */
  this.after('READ', 'Orders', async (orders, req) => {
    if (orders && orders.length > 0) {
      console.log(`User ${req.user.id} (${req.user.roles.join(',')}) accessed ${orders.length} orders`);
    }
    return orders;
  });
  
  /**
   * Example 9: Demonstrate scope checking
   */
  this.before('*', Orders, async (req) => {
    // Check for specific scope
    const hasReadScope = req.user.is('Viewer') || 
                         req.user.is('Editor') || 
                         req.user.is('Manager') || 
                         req.user.is('Administrator');
    
    if (!hasReadScope) {
      return req.reject(403, 'No access to Orders. Please contact administrator.');
    }
  });
  
});
