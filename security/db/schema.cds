namespace security.demo;

/**
 * Entity to demonstrate XSUAA authorization
 */
entity Orders {
  key ID          : UUID;
      orderNumber : String(10);
      customer    : String(100);
      amount      : Decimal(10, 2);
      department  : String(50);  // For attribute-based access control
      costCenter  : String(20);  // For attribute-based access control
      status      : String(20) default 'Open';
      createdAt   : Timestamp @cds.on.insert: $now;
      createdBy   : String @cds.on.insert: $user;
      modifiedAt  : Timestamp @cds.on.insert: $now @cds.on.update: $now;
      modifiedBy  : String @cds.on.insert: $user @cds.on.update: $user;
}

/**
 * Admin-only configuration entity
 */
entity AppConfig {
  key ID        : UUID;
      configKey : String(50);
      value     : String(500);
}
