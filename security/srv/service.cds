using { security.demo as db } from '../db/schema';

/**
 * XSUAA Authorization Demo Service
 * This service demonstrates all aspects of XSUAA:
 * - Scopes (Read, Write, Delete, Admin)
 * - Attributes (Department, CostCenter)
 * - Role Templates (Viewer, Editor, Manager, Administrator)
 */
service SecurityService @(requires: 'authenticated-user') {
  
  /**
   * Orders Entity with Role-Based Access Control
   * 
   * Authorization Rules:
   * - Viewer: Can READ only
   * - Editor: Can READ and WRITE (create/update)
   * - Manager: Can READ, WRITE, and DELETE
   * - Administrator: Full access to all operations
   */
  entity Orders @(restrict: [
    {
      grant: 'READ',
      to: 'Viewer',
      where: 'department = $user.Department'  // Attribute-based filtering
    },
    {
      grant: ['READ', 'WRITE'],
      to: 'Editor',
      where: 'department = $user.Department'  // Can only edit their department
    },
    {
      grant: ['READ', 'WRITE', 'DELETE'],
      to: 'Manager',
      where: 'department = $user.Department'  // Can delete in their department
    },
    {
      grant: '*',  // All operations
      to: 'Administrator'  // No restrictions
    }
  ]) as projection on db.Orders;
  
  /**
   * AppConfig - Admin Only Access
   * Only users with Administrator role can access this
   */
  entity AppConfig @(restrict: [
    {
      grant: '*',
      to: 'Administrator'
    }
  ]) as projection on db.AppConfig;
  
  /**
   * Custom Actions demonstrating scope checks
   */
  
  // Action available to Managers and Administrators
  @(requires: 'Manager')
  action approveOrder(orderID : UUID) returns String;
  
  // Action available only to Administrators
  @(requires: 'Administrator')
  action resetAllOrders() returns String;
  
  /**
   * Functions for reporting
   */
  
  // Available to all authenticated users (inherited from service level)
  function getMyOrders() returns array of Orders;
  
  // Available only to Managers and Administrators
  @(requires: 'Manager')
  function getDepartmentStats(department : String) returns {
    totalOrders : Integer;
    totalAmount : Decimal(10, 2);
    openOrders  : Integer;
  };
}
