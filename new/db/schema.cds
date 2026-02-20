namespace my.bookshop;

entity Books {
  key ID         : Integer;
      title      : String;
      stock      : Integer;
      department : String;  // Department for attribute-based access control
}
