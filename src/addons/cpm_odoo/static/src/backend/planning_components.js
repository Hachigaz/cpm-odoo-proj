/** @odoo-module **/ 
odoo.define('cpm_modules.planning_components', [], function (require) {
    'use strict';

    const { Component, onWillStart, onMounted, mount} = require("@odoo/owl");
    const { KanbanController } = require( "@web/views/kanban/kanban_controller")
    const { kanbanView } = require( "@web/views/kanban/kanban_view")
    const { registry } = require( "@web/core/registry")

    class WorkflowKanban extends KanbanController {
        static template = "cpm_odoo.planning_WorkflowKanban";
    }

    const WorkflowKanbanView = {
        ...kanbanView,
        Controller: WorkflowKanban
    }

    registry.category("views").add("workflow_kanban",WorkflowKanbanView)

    return {WorkflowKanban};
});