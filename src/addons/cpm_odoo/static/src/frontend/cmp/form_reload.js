/** @odoo-module **/ 
odoo.define('cpm_odoo.refresh_on_save', [], function (require) {
    "use strict";

    const { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} = require("@odoo/owl");
    const {FormController} = require('@web/views/form/form_controller');
    const { patch } = require("@web/core/utils/patch");

    patch(FormController.prototype, {
        async onRecordSaved(){
            super.onRecordSaved(...arguments)
            window.location.reload()
        }
    });
});