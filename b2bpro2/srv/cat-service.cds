using { b2bpro2 as db } from '../db/schema';

service test {

    entity Customers as projection on db.Customers;
}
