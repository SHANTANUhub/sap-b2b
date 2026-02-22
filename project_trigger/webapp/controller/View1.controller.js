sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("projecttrigger.controller.View1", {
        onInit() {
            // Initialize local model for form data
            const oLocalModel = new JSONModel({
                orderNumber: "",
                customerName: "",
                orderAmount: "",
                orderDate: "",
                expectedDeliveryDate: "",
                shippingCountry: ""
            });
            this.getView().setModel(oLocalModel, "localModel");
        },

        onTriggerWorkflow: function () {
            const oView = this.getView();
            const oModel = oView.getModel(); // Main OData model
            const oLocalModel = oView.getModel("localModel");
            const oResultStrip = oView.byId("workflowResultStrip");

            // Get form values
            const sOrderNumber = oLocalModel.getProperty("/orderNumber");
            const sCustomerName = oLocalModel.getProperty("/customerName");
            const sOrderAmount = oLocalModel.getProperty("/orderAmount");
            const sOrderDate = oLocalModel.getProperty("/orderDate");
            const sExpectedDelivery = oLocalModel.getProperty("/expectedDeliveryDate");
            const sShippingCountry = oLocalModel.getProperty("/shippingCountry");

            // Validation
            if (!sOrderNumber) {
                MessageBox.error("Please enter an Order Number");
                return;
            }

            // Show loading message
            oResultStrip.setType("Information");
            oResultStrip.setText("Triggering workflow...");
            oResultStrip.setVisible(true);

            // Bind to the triggerWorkflow action
            const oActionBinding = oModel.bindContext("/triggerWorkflow(...)");
            oActionBinding.setParameter("orderNumber", sOrderNumber);
            oActionBinding.setParameter("customerName", sCustomerName || "");
            oActionBinding.setParameter("orderAmount", parseFloat(sOrderAmount) || 0);
            oActionBinding.setParameter("orderDate", sOrderDate || "");
            oActionBinding.setParameter("expectedDeliveryDate", sExpectedDelivery || "");
            oActionBinding.setParameter("shippingCountry", sShippingCountry || "");

            // Execute the action
            oActionBinding.execute()
                .then(() => {
                    const oContext = oActionBinding.getBoundContext();
                    const oResult = oContext.getObject();
                    
                    // Show success message
                    oResultStrip.setType("Success");
                    oResultStrip.setText(`✓ Workflow triggered successfully! Instance ID: ${oResult.workflowInstanceId}`);
                    MessageToast.show("Workflow Initiated Successfully!");

                    // Clear form after successful trigger
                    this.onClearForm();
                })
                .catch((oError) => {
                    // Show error message
                    oResultStrip.setType("Error");
                    oResultStrip.setText("✗ Error triggering workflow: " + (oError.message || "Unknown error"));
                    MessageBox.error("Failed to trigger workflow. Please check the console for details.");
                    console.error("Workflow trigger error:", oError);
                });
        },

        onClearForm: function () {
            const oLocalModel = this.getView().getModel("localModel");
            oLocalModel.setData({
                orderNumber: "",
                customerName: "",
                orderAmount: "",
                orderDate: "",
                expectedDeliveryDate: "",
                shippingCountry: ""
            });

            const oResultStrip = this.getView().byId("workflowResultStrip");
            oResultStrip.setVisible(false);
        }
    });
});