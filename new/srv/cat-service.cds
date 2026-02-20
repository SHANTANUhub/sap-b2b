using my.bookshop as my from '../db/schema';

/**
 * Catalog Service with XSUAA Authorization
 * Demonstrates role-based access control using XSUAA scopes
 */
service CatalogService @(requires: 'authenticated-user') {
    
    /**
     * Books Entity with Role-Based Access Control
     * 
     * Authorization Rules:
     * - Viewer: Can READ only
     * - Editor: Can READ and WRITE (create/update)
     * - Manager: Can READ, WRITE, and DELETE
     * - Administrator: Full access to all operations
     */
    entity Books @(restrict: [
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
            where: 'department = $user.Department'  // Can manage in their department
        },
        {
            grant: '*',  // All operations
            to: 'Administrator'  // No restrictions
        }
    ]) as projection on my.Books;
    
    /**
     * Custom Actions demonstrating scope checks
     */
    
    // Action available to Managers and Administrators
    @(requires: 'Manager')
    action updateBookStock(bookID : Integer, newStock : Integer) returns String;
    
    // Action available only to Administrators
    @(requires: 'Administrator')
    action resetAllStock() returns String;
    
    /**
     * Functions for reporting
     */
    
    // Available to all authenticated users
    function getAvailableBooks() returns array of Books;
    
    // Available only to Managers and Administrators
    @(requires: 'Manager')
    function getBookStatistics() returns {
        totalBooks : Integer;
        totalStock : Integer;
        lowStockCount : Integer;
    };
}
