const cds = require("@sap/cds");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

module.exports = class test extends cds.ApplicationService {
  async init() {

    // =======================
    // GET DATA
    // =======================
    this.on("getData", async (req) => {
      try {
        const response = await executeHttpRequest(
          { destinationName: "pro1" },
          {
            method: "GET",
            url: "/odata/v4/catalog/Products",
          }
        );

        console.log("Response data:", JSON.stringify(response.data));
        debugger;
        return response.data;
      } catch (e) {
        console.error(e.response?.data || e.message);
        return req.error(500, "Failed to fetch Products from pro1");
      }
    });
     // =======================
    // CREATE Products
    // =======================
    this.on("createProduct", async (req) => {
      const { ID, name, price,quantity } = req.data;

      try {
        const response = await executeHttpRequest(
          { destinationName: "pro1" },
          {
            method: "POST",
            url: "/odata/v4/catalog/Products",
            data: { ID, name, price,quantity },
          }
        );

        console.log("Created product:", JSON.stringify(response.data));
        return JSON.stringify(response.data);
      } catch (e) {
        console.error(e.response?.data || e.message);
        return req.error(500, "Failed to create Product  in pro1");
      }
    });


    return super.init();
  }
};