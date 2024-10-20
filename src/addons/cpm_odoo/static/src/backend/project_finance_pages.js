/** @odoo-module **/ 
odoo.define('cpm_modules.project_finance_pages', ["@odoo/owl"], function (require) {
    'use strict';

    const { Component, onWillStart, onMounted, mount} = require("@odoo/owl");


    class ProjectOverviewPage extends Component {
        static template = "cpm_odoo.ProjectOverviewPage";
        static templatePath = "cpm_odoo/static/src/backend/project_finance_pages.xml"
    }

    class ProjectFinancePage extends Component {
        static template = "cpm_odoo.ProjectFinancePage"
        static templatePath = "cpm_odoo/static/src/backend/project_finance_pages.xml";
    }

    
    return {ProjectOverviewPage,ProjectFinancePage};
});