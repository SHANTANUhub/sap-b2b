using { b2bpro1 as db } from '../db/schema';

service CatalogService {
    entity Products as projection on db.Products;
    
    // Workflow trigger action
    action triggerWorkflow(
        orderNumber: String,
        customerName: String,
        orderAmount: Decimal,
        orderDate: String,
        expectedDeliveryDate: String,
        shippingCountry: String
    ) returns String;
}
