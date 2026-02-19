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

    return super.init();
  }
};