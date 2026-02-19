using { b2bpro1 as db } from '../db/schema';

service CatalogService {
    entity Products as projection on db.Products;
}
