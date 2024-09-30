from odoo import models,fields,api

class Workflow(models.Model):
    _name = "cpm_odoo.planning_workflow"
    _description = ""
    
    planning_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_planning', 
        string='planning_id',
        readonly=True,
        required = True
    )
    
    task_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task', 
        inverse_name = 'workflow_id', 
        string='Tasks')
    
    name = fields.Char(
        String = 'Name',
        required=True,
        size = 256
    )

    description = fields.Text(
        string = 'Description'
    )

class Task(models.Model):
    _name = "cpm_odoo.planning_task"
    _description = ""
    
    workflow_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_workflow', 
        string = 'Workflow',
        readonly = True
    )
    
    name = fields.Char(
        String = 'Name',
        required=True,
        size = 256
    )

    description = fields.Text(
        string = 'Description'
    )
    
    date_created = fields.Date(
        string = 'Date Created',
        default = fields.Date.today(),
        readonly=True
    )
    
    is_draft = fields.Boolean(
        string = 'Draft',
        default = 'False'
    )
    is_completed = fields.Boolean(
        string = 'Completed',
        default = 'False'
    )
    is_verified = fields.Boolean(
        string = 'Verified',
        default = 'False'
    )
    
    assigned_staff_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='Assigned Staffs'
    )
    
    assigned_contractor_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.contractors_contractor', 
        string='Assigned Contractors'
    )