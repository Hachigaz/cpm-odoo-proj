from odoo import models,fields,api
import json

class Workflow(models.Model):
    _name = "cpm_odoo.planning_workflow"
    _description = "Model"
    
    planning_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_planning', 
        string='planning_id',
        # readonly=True,
        required = True
    )
    
    task_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task', 
        inverse_name = 'workflow_id', 
        string='Tasks'
    )
    
    start_date = fields.Date(
        string = 'Start Date',
        required=True,
        default = lambda self: self._get_default_start_date()
    )
    
    def _get_default_start_date(self):
        def_start_date = self.planning_id.project_id.start_date
        for deps in self.depends_on :
            if(def_start_date < deps.start_date):
                def_start_date = deps.start_date
        return def_start_date
    
    
    @api.constrains('start_date')
    def  _check_date(self):
        for record in self:
            if record.start_date <= record.planning_id.project_id.start_date:
                raise ValidationError("Start date of the workflow must be larger than start date of the project.")
    
    exp_end = fields.Date(
        string = 'Due Date',
        default = lambda self: self._get_default_start_date()
    )
    
    # exp_end = fields.Date(
    #     string = 'Due Date',
    #     compute = '_compute_exp_end_date',
    #     store=True
    # )
    
    # @api.depends('start_date','task_ids.exp_end')
    # def _compute_exp_end_date(self):
    #     for record in self:
    #         exp_end = record.start_date
    #         for task_id in record.task_ids:
    #             if(date < task_id.exp_end):
    #                 exp_end = task_id.exp_end
                    
    #         record.exp_end = exp_end
    #     pass
        
    end_date = fields.Date(
        string = 'Finished',
        compute = '_compute_end_date',
        store=True
    )
    
    @api.depends('start_date','task_ids.end_date')
    def _compute_exp_end_date(self):
        for record in self:
            exp_end = record.start_date
            for task_id in record.task_ids:
                if(date < task_id.exp_end):
                    exp_end = task_id.exp_end
                    
            record.exp_end = exp_end
        pass
    
    
    depends_on = fields.Many2many(
        comodel_name = 'cpm_odoo.planning_workflow', 
        string='Dependencies',
        relation = 'cpm_odoo_pl_workflow_deps',
        column1='cur_workflow',
        column2='dep_workflow'
    )
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )

    description = fields.Text(
        string = 'Description'
    )
    
    task_count = fields.Integer(
        string = 'Task Count',
        compute = '_compute_task_count',
        store=True
    )
    
    @api.depends('task_ids')
    def _compute_exp_end_date(self):
        for record in self:
            record.draft_task_count = len(record.task_ids)
        pass
    
    draft_task_count = fields.Integer(
        string = 'Draft Count',
        compute = '_compute_draft_task_count',
        store=True
    )
    
    @api.depends('task_ids.is_draft')
    def _compute_draft_task_count(self):
        for record in self:
            draft_task_count = sum(1 for task in record.task_ids if task.is_draft)
            record.draft_task_count = draft_task_count
        pass
    
    @api.model
    def create_new_workflow(self):
        default_planning_id = self.env.context["params"]["default_planning_id"]
        client_action = self.env.context["params"]["client_action"]
        
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'name': 'Create New Workflow',
            'res_model': 'cpm_odoo.planning_workflow',
            # 'domain': [],
            'context': {
                'default_planning_id':default_planning_id,
                "client_action":client_action
            },
            'target': 'self'
            # 'help': '<p class="o_view_nocontent_smiling_face">No appointments found for this profile.</p>'
        }
   
class Task(models.Model):
    _name = "cpm_odoo.planning_task"
    _description = "Model"
    
    workflow_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_workflow',
        string = 'Workflow',
        readonly = True
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
    
    depends_on = fields.Many2many(
        comodel_name = 'cpm_odoo.planning_task', 
        string='Dependencies',
        relation = 'cpm_odoo_pl_task_deps',
        column1='cur_task',
        column2='dep_task'
    )
    
    @api.constrains('depends_on')
    def _validate_task_dependencies(self):
        for record in self:
            if(record.depends_on):
                for task in record.depends_on:
                    if(record.workflow_id != task.workflow_id):
                        raise ValidationError("The depending tasks must be in the same workflow as the current task.")
    
    start_date = fields.Date(
        string = 'Start Date',
        required = True,
        default = lambda self: self._get_default_start_date()
    )
    
    def _get_default_start_date(self):
        def_start_date = self.workflow_id.start_date
        for deps in self.depends_on :
            if(def_start_date < deps.start_date):
                def_start_date = deps.start_date
        return def_start_date
    
    @api.constrains('start_date')
    def _validate_start_date(self):
        for record in self:
            if(record.start_date < record.workflow_id.start_date):
                raise ValidationError("The start date must be larger than the start date of the workflow.")
            if(record.depends_on):
                for task in record.depends_on:
                    if(record.start_date < task.exp_end):
                        raise ValidationError("The start date must be larger than the expected end date of the depending tasks.")
                    
    
    exp_end = fields.Date(
        string = 'Due',
        required=True
    )
    
    @api.constrains('exp_end')
    def _validate_exp_end(self):
        for record in self:
            if(record.exp_end < record.start_date):
                raise ValidationError("The end date must be larger than the start date.")
    
    end_date = fields.Date(
        string = 'Finished'
    )
    
    @api.onchange('is_verified')
    def _set_task_end_date(self):
        for record in self:
            if(record.is_verified):
                record.end_date = fields.Date.today()
        
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

class TaskNote(models.Model):
    _name = 'cpm_odoo.planning_task_note'
    _description = "Model"
    
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
    _description = "Model"
    
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