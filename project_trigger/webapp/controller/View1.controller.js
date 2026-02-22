sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("projecttrigger.controller.View1", {
        onInit() {
        },

        onTriggerWorkflow: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oResultStrip = oView.byId("workflowResultStrip");

            // Get form values directly from controls
            var sOrderNumber = oView.byId("orderNumberInput").getValue();
            var sCustomerName = oView.byId("customerNameInput").getValue();
            var sOrderAmount = oView.byId("orderAmountInput").getValue();
            var sOrderDate = oView.byId("orderDatePicker").getValue();
            var sExpectedDelivery = oView.byId("expectedDeliveryPicker").getValue();
            var sShippingCountry = oView.byId("shippingCountryInput").getValue();

            // Validation
            if (!sOrderNumber) {
                MessageToast.show("Please enter an Order Number");
                return;
            }

            // Show loading message
            oResultStrip.setType("Information");
            oResultStrip.setText("Triggering workflow...");
            oResultStrip.setVisible(true);

            // Bind to the triggerWorkflow action
            var oActionBinding = oModel.bindContext("/triggerWorkflow(...)");
            oActionBinding.setParameter("orderNumber", sOrderNumber);
            oActionBinding.setParameter("customerName", sCustomerName || "");
            oActionBinding.setParameter("orderAmount", parseFloat(sOrderAmount) || 0);
            oActionBinding.setParameter("orderDate", sOrderDate || "");
            oActionBinding.setParameter("expectedDeliveryDate", sExpectedDelivery || "");
            oActionBinding.setParameter("shippingCountry", sShippingCountry || "");

            // Execute the action
            oActionBinding.execute()
                .then(function () {
                    var oContext = oActionBinding.getBoundContext();
                    var oResult = oContext.getObject();
                    
                    // Show success message
                    oResultStrip.setType("Success");
                    oResultStrip.setText("Workflow Instance ID: " + oResult.workflowInstanceId);
                    MessageToast.show("Workflow Initiated!");
                })
                .catch(function (oError) {
                    // Show error message
                    oResultStrip.setType("Error");
                    oResultStrip.setText("Error triggering workflow");
                    MessageToast.show("Error triggering BPA");
                    console.error(oError);
                });
        },

        onClearForm: function () {
            var oView = this.getView();
            
            // Clear all input fields
            oView.byId("orderNumberInput").setValue("");
            oView.byId("customerNameInput").setValue("");
            oView.byId("orderAmountInput").setValue("");
            oView.byId("orderDatePicker").setValue("");
            oView.byId("expectedDeliveryPicker").setValue("");
            oView.byId("shippingCountryInput").setValue("");

            // Hide result strip
            var oResultStrip = oView.byId("workflowResultStrip");
            oResultStrip.setVisible(false);
        }
    });
});