const cds = require('@sap/cds');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

module.exports = class CatalogService extends cds.ApplicationService {
  async init() {

    const { Products } = cds.entities('CatalogService');

    this.before(['CREATE', 'UPDATE'], Products, async (req) => {
      console.log('Before CREATE/UPDATE Products', req.data);
    });

    this.after('READ', Products, async (products, req) => {
      console.log('After READ Products', products);
    });

    // =======================
    // TRIGGER BPA WORKFLOW
    // =======================
    this.on('triggerWorkflow', async (req) => {
      const { 
        customerName, 
        expectedDeliveryDate, 
        orderAmount, 
        orderDate, 
        orderNumber, 
        shippingCountry 
      } = req.data;

      if (!orderNumber) {
        return req.error(400, 'orderNumber is required');
      }

      const oPayload = {
        definitionId: 'us10.a3edfe08trial.processlevel.myapitrigger',
        context: {
          customerName: customerName || '',
          expectedDeliveryDate: expectedDeliveryDate || '',
          orderAmount: parseFloat(orderAmount) || 0,
          orderDate: orderDate || '',
          orderNumber: orderNumber || '',
          shippingCountry: shippingCountry || ''
        }
      };

      console.log('Workflow Payload:', JSON.stringify(oPayload, null, 2));

      // Check if running in production mode
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        // Production: Call actual BPA workflow
        try {
          const response = await executeHttpRequest(
            { destinationName: 'spa_process_destination' },
            {
              method: 'POST',
              url: '/v1/workflow-instances',
              data: oPayload,
              headers: { 'Content-Type': 'application/json' },
              fetchCsrfToken: false
            }
          );

          console.log('Workflow triggered successfully:', JSON.stringify(response.data, null, 2));
          return { 
            workflowInstanceId: response.data.id,
            status: 'Workflow triggered successfully'
          };
        } catch (error) {
          console.error('Error triggering workflow:', error.response?.data || error.message);
          return req.error(500, `Failed to trigger workflow: ${error.message}`);
        }
      } else {
        // Local development: Return mock response
        const mockInstanceId = `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log('Local Mode: Returning mock workflow instance:', mockInstanceId);
        console.log('In production, this would trigger BPA workflow with payload above');
        
        return { 
          workflowInstanceId: mockInstanceId,
          status: 'Workflow triggered successfully (local mode)'
        };
      }
    });

    return super.init();
  }
};
