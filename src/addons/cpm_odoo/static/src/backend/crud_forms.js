/** @odoo-module **/

odoo.define(
    'cpm_modules.crud_forms',
    [
        "@odoo/owl",
        "cpm_modules.component_utils"
    ], 
    function (require) {
    'use strict';

    
    const { Component, onWillStart, onMounted, mount, loadFile} = require("@odoo/owl");

    class Form extends Component{

        static template = "cpm_odoo.form_template";
        static template_path = ""

        setup(){

            super.setup()
        }
    }

    return {Form}
});