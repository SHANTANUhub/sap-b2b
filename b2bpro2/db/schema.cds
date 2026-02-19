namespace b2bpro2;
entity Customers {
  key ID    : UUID;
  name      : String(100);
  email     : String(100);
  city      : String(50);
}
