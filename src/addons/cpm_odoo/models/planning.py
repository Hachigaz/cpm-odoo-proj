from odoo import models,fields,api

from odoo.exceptions import ValidationError

class Workflow(models.Model):
    _name = "cpm_odoo.planning_workflow"
    _description = "Model"
    
    planning_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_planning', 
        string='planning_id',
        readonly=True,
        required = True
    )
    
    task_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task', 
        inverse_name = 'workflow_id', 
        string='Tasks'
    )
    
    start_date = fields.Date(
        string = 'Start Date',
        required=True
    )
    
    @api.constrains('start_date')
    def  _check_date(self):
        for record in self:
            if record.start_date < record.planning_id.project_id.start_date:
                raise ValidationError("The start date of the workflow must be larger than start date of the project ({}).".format(record.planning_id.project_id.start_date))
            
            if(record.depends_on):
                for workflow in record.depends_on:
                    if(record.start_date < workflow.start_date):
                        raise ValidationError("The start date must be larger than the expected end date of the depending workflows ({}).".format(workflow.start_date))
    
    exp_end = fields.Date(
        string = 'Due Date',
        compute = '_compute_exp_end_date',
        store=True
    )
    
    @api.depends('task_ids.exp_end')
    def _compute_exp_end_date(self):
        for record in self:
            min_date = fields.Date.to_date('0001-01-01')
            exp_end = min_date
            for task_id in record.task_ids:
                if(exp_end < task_id.exp_end):
                    exp_end = task_id.exp_end
                    
            if exp_end == min_date:
                record.exp_end = False
            else:
                record.exp_end = exp_end
        pass
        
    end_date = fields.Date(
        string = 'Finished',
        default = fields.Date.from_string('1000-01-01'),
        readonly=True
    )
    
    
    depends_on = fields.Many2many(
        comodel_name = 'cpm_odoo.planning_workflow', 
        string='Dependencies',
        relation = 'cpm_odoo_pl_workflow_deps',
        column1='cur_workflow',
        column2='dep_workflow'
    )
    
    @api.constrains('depends_on')
    def _validate_task_dependencies(self):
        for record in self:
            if(record.depends_on):
                for workflow in record.depends_on:
                    if(record.planning_id != workflow.planning_id):
                        raise ValidationError("The depending workflows must be in the same project as the current workflow.")
    
    
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
    def _compute_task_count(self):
        for record in self:
            record.not_started_task_count = len(record.task_ids)
        pass
    
    not_started_task_count = fields.Integer(
        string = 'Not Started Count',
        compute = '_compute_not_started_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status')
    def _compute_not_started_task_count(self):
        for record in self:
            not_started_task_count = sum(1 for task in record.task_ids if task.task_status == "not_started")
            record.not_started_task_count = not_started_task_count
        pass
    
    in_progress_task_count = fields.Integer(
        string = 'Not Started Count',
        compute = '_compute_in_progress_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status')
    def _compute_in_progress_task_count(self):
        for record in self:
            in_progress_task_count = sum(1 for task in record.task_ids if task.task_status == "in_progress")
            record.in_progress_task_count = in_progress_task_count
        pass
    
    completed_task_count = fields.Integer(
        string = 'Not Started Count',
        compute = '_compute_completed_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status')
    def _compute_completed_task_count(self):
        for record in self:
            completed_task_count = sum(1 for task in record.task_ids if task.task_status == "completed")
            record.completed_task_count = completed_task_count
        pass
    
    verified_task_count = fields.Integer(
        string = 'Not Started Count',
        compute = '_compute_verified_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status')
    def _compute_verified_task_count(self):
        for record in self:
            verified_task_count = sum(1 for task in record.task_ids if task.task_status == "verified")
            record.verified_task_count = verified_task_count
        pass
    
    workflow_status = fields.Selection(
        [
            ('draft', 'Draft'),
            ('active', 'Active'),
            ('finished', 'Finished')
        ], 
        string='Status',
        default='draft',
        readonly=True
    )
    
    @api.model
    def mark_active(self, workflow_id):
        workflow = self.env["cpm_odoo.planning_workflow"].browse(workflow_id)
        
        #check for unassigned tasks
        
        #set active status
        
        pass
    
    @api.model
    def mark_finished(self, workflow_id):
        workflow = self.env["cpm_odoo.planning_workflow"].browse(workflow_id)
        
        #check for unverified tasks
        
        #set end date and set finished status
        
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
    
    unassigned_task_count = fields.Integer(
        string = 'Unassigned Task Count',
        compute = '_compute_unassigned_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status')
    def _compute_unassigned_task_count(self):
        for record in self:
            unassigned_task_count = sum(1 for task in record.task_ids if len(task.assigned_staff_ids) == 0 and len(task.assigned_contractor_ids) == 0)
            record.unassigned_task_count = unassigned_task_count
        pass
   
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
    
    task_status = fields.Selection(
        [
            ('not_started', 'Not Started'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('verified', 'Verified')
        ], 
        string='task_status',
        default="not_started",
        readonly=True
    )
    
    @api.model
    def mark_completed(self, task_id):
        
        pass
    
    
    @api.model
    def mark_verified(self, task_id):
        
        pass
    
    
    assigned_staff_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='Assigned Staffs',
        relation = 'cpm_odoo_pl_task_hr_staff'
    )
    
    assigned_staff_count = fields.Integer(
        string = 'Assigned Staff Count',
        compute = '_compute_assigned_staff_count',
        store=True
    )
    
    @api.depends('assigned_staff_count')
    def _compute_assigned_staff_count(self):
        for record in self:
            record.assigned_staff_count = len(record.assigned_staff_ids)
        pass
    
    assigned_contractor_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_contractor', 
        string='Assigned Contractors',
        relation = 'cpm_odoo_pl_task_stk_contractor'
    )
    
    assigned_contractor_count = fields.Integer(
        string = 'Assigned Contractor Count',
        compute = '_compute_assigned_contractor_count',
        store=True
    )
    
    @api.depends('assigned_contractor_count')
    def _compute_assigned_contractor_count(self):
        for record in self:
            record.assigned_contractor_count = len(record.assigned_contractor_ids)
        pass
    
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
        required = True
    )
    
    @api.constrains('start_date')
    def _validate_start_date(self):
        for record in self:
            if(record.start_date < record.workflow_id.start_date):
                raise ValidationError("The task start date must be larger than the start date of the workflow ({}).".format(record.workflow_id.start_date))
            if(record.depends_on):
                for task in record.depends_on:
                    if(record.start_date < task.exp_end):
                        raise ValidationError("The start date must be larger than the expected end date of the depending tasks ({}).".format(task.exp_end))
                    
    
    exp_end = fields.Date(
        string = 'Due',
        required=True
    )
    
    @api.constrains('exp_end')
    def _validate_exp_end(self):
        for record in self:
            if(record.exp_end < record.start_date):
                raise ValidationError("The expected end date must be larger than the start date.")
    
    end_date = fields.Date(
        string = 'Finished',
        readonly=True
    )
    
    @api.onchange('is_verified')
    def _set_task_end_date(self):
        for record in self:
            if(record.is_verified):
                record.end_date = fields.Date.today()
        
    # date_created = fields.Datetime(
    #     'Date Created',
    #     default = fields.Datetime.now(),
    #     required=True
    # )
    
    # created_by = fields.Many2one(
    #     comodel_name ='cpm_odoo.human_res_staff', 
    #     string='Created By',
    #     required=True
    # )
    
    @api.model
    def create_new_task(self):
        default_workflow_id = self.env.context["params"]["default_workflow_id"]
        client_action = self.env.context["params"]["client_action"]
        
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'name': 'Create New Task',
            'res_model': 'cpm_odoo.planning_task',
            # 'domain': [],
            'view_id':self.env.ref("cpm_odoo.planning_task_create_view_form").id,
            'context': {
                'default_workflow_id':default_workflow_id,
                "client_action":client_action,
            },
            'target': 'self'
        }
        
        
    task_note_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task_note', 
        inverse_name = 'task_id', 
        string='Notes'
    )
    
    task_expense_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task_expense', 
        inverse_name = 'task_id', 
        string='Expenses'
    )
    
    @api.model
    def create_new_expense(self):
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'name': 'Create New Task',
            'res_model': 'cpm_odoo.planning_task_expense',
            # 'domain': [],
            'context': {
                'default_workflow_id':default_workflow_id,
                "client_action":client_action,
            },
            'target': 'self'
        }

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