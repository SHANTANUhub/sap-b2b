using { b2bpro2 as db } from '../db/schema';

service CatalogService {

    entity Customers as projection on db.Customers;
}
