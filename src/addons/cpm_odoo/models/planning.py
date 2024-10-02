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
    
    task_count = fields.Integer(
        string = 'Task count',
        readonly = True,
        default = 0
    )
    
    task_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task', 
        inverse_name = 'workflow_id', 
        string='Tasks')
    
    name = fields.Char(
        string = 'Name',
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
    
    index = fields.Integer(
        string = 'index',
        required=True,
        default = -1
    )
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )

    description = fields.Text(
        string = 'Description'
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
        string='Assigned Staffs',
        relation = 'cpm_odoo_pl_task_hr_staff'
    )
    
    assigned_contractor_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_contractor', 
        string='Assigned Contractors',
        relation = 'cpm_odoo_pl_task_stk_contractor'
    )
    
    exp_start = fields.Date(
        string = 'Expected Start',
        required=True
    )
    
    start_date = fields.Date(
        string = 'Start Date'
    )
    
    exp_end = fields.Date(
        string = 'Due',
        required=True
    )
    
    end_date = fields.Date(
        string = 'Finished'
    )
    
    date_created = fields.Datetime(
        'Date Created',
        default = fields.Datetime.now(),
        required=True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string='Created By',
        required=True
    )
    
    @api.model_create_multi
    def create(self, vals):
        
        return super().create(vals)

class TaskNote(models.Model):
    _name = 'cpm_odoo.planning_task_note'
    _description = ''
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task',
        string='Task',
        required=True,
        ondelete = 'cascade'
    )
    
    title = fields.Char(
        string = 'Title',
        size = 256,
        required=True
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    date_created = fields.Datetime(
        string = 'Date Posted',
        default = fields.Datetime.now(),
        required = True
    )
    
    created_by = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='Posted By',
        required = True
    )

class TaskExpense(models.Model):
    _name = 'cpm_odoo.planning_task_expense'
    _description = ''
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task',
        string='Task',
        required=True,
        ondelete = 'cascade'
    )
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    date_created = fields.Datetime(
        'Date Created',
        default = fields.Datetime.now(),
        required=True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string='Created By',
        required=True,
        ondelete='restrict'
    )
    
    amount_cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency'
    )
    
    amount = fields.Monetary(
        string = 'Amount',
        currency_field = 'amount_cur_id'
    )