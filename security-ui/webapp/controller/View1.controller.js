sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("securityui.controller.View1", {
        onInit() {
        },

        onRefresh() {
            const oTable = this.byId("ordersTable");
            const oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
                MessageToast.show("Data refreshed");
            }
        },

        onCreateOrder() {
            MessageBox.information("Create Order functionality to be implemented");
            // TODO: Implement create order dialog
            // This will require creating a new order entry with proper authorization
        },

        onOrderPress(oEvent) {
            const oItem = oEvent.getSource();
            const oContext = oItem.getBindingContext();
            const sOrderNumber = oContext.getProperty("orderNumber");
            MessageToast.show("Selected Order: " + sOrderNumber);
            // TODO: Navigate to order details view or show order details dialog
        }
    });
});