service test {
    action getData() returns String;
    action createProduct(
  ID       : UUID,
  name     : String,
  price    : Decimal(10,2),
  quantity : Integer
) returns String;

}
    