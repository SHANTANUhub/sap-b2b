/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["ui5multiplebackend1/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
