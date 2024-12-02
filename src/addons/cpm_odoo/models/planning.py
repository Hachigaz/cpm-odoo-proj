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
        default = fields.Date.today(),
        required=True
    )
    
    @api.constrains('start_date')
    def  _validate_start_date(self):
        for record in self:
            if record.start_date < record.planning_id.project_id.start_date:
                raise ValidationError("The start date of the workflow must be larger than start date of the project ({}).".format(record.planning_id.project_id.start_date))
            for dep_rec in record.depends_on:
                if record.start_date < dep_rec.exp_end:
                    raise ValidationError(f"The start date of the workflow must be larger than the expected end date of the depending workflows (Workflow {dep_rec.name} - {dep_rec.exp_end}).")
    
    exp_end = fields.Date(
        string = 'Due Date',
        required=True
    )
    
    @api.constrains('exp_end')
    def  _validate_exp_end(self):
        for record in self:
            if record.start_date > record.exp_end:
                raise ValidationError("The expected end date of the workflow must be larger than start date of the workflow.")
        
    end_date = fields.Date(
        string = 'Finished at',
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
    def _validate_workflow_dependencies(self):
        for record in self:
            if(record.depends_on):
                for workflow in record.depends_on:
                    if(record.planning_id != workflow.planning_id):
                        raise ValidationError("The depending workflows must be in the same project as the current workflow.")
                    if(record.start_date < workflow.exp_end):
                        raise ValidationError(f"The depending workflow ({workflow.name}) expected end date ({workflow.exp_end}) must be larger than the start date of the current workflow ({record.start_date}).")
    
    
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
            record.active_task_count = len(record.task_ids)
        pass
    
    active_task_count = fields.Integer(
        string = 'Active',
        compute = '_compute_active_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status')
    def _compute_active_task_count(self):
        for record in self:
            active_task_count = sum(1 for task in record.task_ids if task.task_status == "active")
            record.active_task_count = active_task_count
        pass
    
    completed_task_count = fields.Integer(
        string = 'Completed',
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
        if(workflow.unassigned_task_count>0):
            raise ValidationError(f"The workflow {workflow.name} has unassigned tasks.")
        #set active status
        if workflow.workflow_status =='draft':
            workflow.workflow_status = 'active'
        else:
            raise ValidationError(f"The workflow {workflow.name} is not in draft status.")
        
        pass
    
    @api.model
    def mark_finished(self, workflow_id):
        workflow = self.env["cpm_odoo.planning_workflow"].browse(workflow_id)
        #check for unverified tasks
        #set end date and set finished status
        if(workflow.verified_task_count == workflow.task_count):
            workflow.end_date = fields.Date.today()
            workflow.workflow_status = 'finished'
        else:
            raise ValidationError(f"The workflow {workflow.name} has unverified tasks.")
        
        pass
    
    @api.model
    def act_create_new_workflow(self,planning_id):
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'name': 'Create New Workflow',
            'res_model': 'cpm_odoo.planning_workflow',
            # 'domain': [],
            'view_id':self.env.ref("cpm_odoo.planning_workflow_create_view_form").id,
            'context': {
                'default_planning_id':planning_id
            },
            'target': 'new'
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
   
class TaskAssignContractor(models.Model):
    _name = "cpm_odoo.planning_task_assign_contractor"
    _description = "TaskAssignContractor"
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task', 
        string='task',
        ondelete="cascade",
        required=True
    )
    
    contractor_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_contractor', 
        string='contractor',
        ondelete="restrict",
        required=True
    )
    
    contract_set_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_contract_set', 
        string='contract_set',
        ondelete="restrict",
        default=None
    )
   
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
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task_category', 
        string='Category',
        ondelete='restrict',
        auto_join = True
    )

    description = fields.Text(
        string = 'Description'
    )
    
    task_status = fields.Selection(
        [
            ('active', 'Active'),
            ('completed', 'Completed'),
            ('verified', 'Verified')
        ], 
        string='task_status',
        default="active",
        readonly=True
    )
    
    @api.model
    def act_mark_completed(self, task_id):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        if(task.task_status == "active"):
            task.task_status = "completed"
        else:
            raise ValidationError("The task status is not completed.")
        pass
    
    @api.model
    def act_verify_task(self,task_id):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        if(task.task_status == "completed"):
            task.task_status = "verified"
        else:
            raise ValidationError("The task status is not completed.")
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
    
    @api.depends('assigned_staff_ids')
    def _compute_assigned_staff_count(self):
        for record in self:
            record.assigned_staff_count = len(record.assigned_staff_ids)
        pass
    
    @api.model
    def act_assign_staffs_to_task(self,task_id,staff_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        staff_recs = self.env["cpm_odoo.human_res_staff"].browse(staff_ids)

        task.write({
            "assigned_staff_ids":[[4,id] for id in staff_ids]
        })
        
        for staff in staff_recs:
            staff.user_id.write({
                'groups_id':[(4,task.workflow_id.planning_id.project_id.proj_mem_group_id.id)]
            })

        pass
    
    @api.model
    def act_unassign_staffs_to_task(self,task_id,staff_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        staff_recs = self.env["cpm_odoo.human_res_staff"].browse(staff_ids)

        task.write({
            "assigned_staff_ids":[[3,id] for id in staff_ids]
        })
        
        for staff in staff_recs:
            staff.user_id.write({
                'groups_id':[(3,task.workflow_id.planning_id.project_id.proj_mem_group_id.id)]
            })

        pass
    
    
    
    assigned_contractor_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task_assign_contractor', 
        inverse_name = 'task_id', 
        string='assigned_contractor'
    )
    
    assigned_contractor_count = fields.Integer(
        string = 'Assigned Contractor Count',
        compute = '_compute_assigned_contractor_count',
        store=True
    )
    
    @api.depends('assigned_contractor_ids')
    def _compute_assigned_contractor_count(self):
        for record in self:
            record.assigned_contractor_count = len(record.assigned_contractor_ids)
        pass
    
    @api.model
    def act_assign_contractors_to_task(self,task_id,contractor_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)

        task.write(
            {
                "assigned_contractor_ids":[
                    (0,0,{
                        "contractor_id":contractor_id
                    }) for contractor_id in contractor_ids
                ]
            }
        )
        pass
    
    @api.model
    def act_unassign_contractors_to_task(self,task_id,contractor_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)

        task.write({
            "assigned_contractor_ids":[[2,id] for id in contractor_ids]
        })

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
                    if(record.start_date < task.exp_end):
                        raise ValidationError(f"The depending task ({task.name}) expected end date ({task.exp_end}) must be larger than the start date of the current task ({record.start_date}).")
    
    start_date = fields.Date(
        string = 'Start Date',
        required = True
    )
    
    @api.constrains('start_date')
    def _validate_start_date(self):
        for record in self:
            if(record.start_date < record.workflow_id.start_date):
                raise ValidationError("The task start date must be larger than the start date of the workflow ({}).".format(record.workflow_id.start_date))
            for dep_rec in record.depends_on:
                if record.start_date < dep_rec.exp_end:
                    raise ValidationError(f"The start date of the task must be larger than the expected end date of the depending tasks (Workflow {dep_rec.name} - {dep_rec.exp_end}).")
    
    exp_end = fields.Date(
        string = 'Due',
        required=True
    )
    
    @api.constrains('exp_end')
    def _validate_exp_end(self):
        for record in self:
            if(record.exp_end < record.start_date):
                raise ValidationError("The expected end date must be larger than the start date.")
            if(record.exp_end > record.workflow_id.exp_end):
                raise ValidationError(f"The expected end date must be larger than workflow expected end date ({record.workflow_id.exp_end}).")
  
    
    end_date = fields.Date(
        string = 'Finished',
        readonly=True
    )
        
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
    def create_new_expense(self,task_id):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        expense_type = "base"
        if(not task.workflow_id.workflow_status=="draft"):
            expense_type = "additonal"
            
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'name': 'New Task Expense',
            'res_model': 'cpm_odoo.planning_task_expense',
            # 'domain': [],
            'view_id':self.env.ref("cpm_odoo.planning_task_expense_create_view_form").id,
            'views':[(False,'form')],
            'context': {
                'default_task_id':task.id,
                'default_project_finance_id':task.workflow_id.planning_id.project_id.proj_finance_id.id,
                'default_expense_type':expense_type
            },
            'target': 'new'
        }

        
    attached_document_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.documents_document_set', 
        string='attached_document',
        relation='cpm_odoo_task_attached_docs',
        column1="atch_task_id",
        column2="atch_doc_id"
    )
    
    attached_document_count = fields.Integer(
        compute='_compute_attached_document_count', 
        string='attached_document_count',
        store=True
    )
    
    @api.depends('attached_document_ids')
    def _compute_attached_document_count(self):
        for record in self:
            record.attached_document_count = len(record.attached_document_ids)
        pass
    
    @api.model
    def act_create_task(self,workflow_id):
        workflow = self.env["cpm_odoo.planning_workflow"].browse(workflow_id)
        if(workflow.workflow_status=="draft"):
            return {
                'type': 'ir.actions.act_window',
                'view_mode': 'form',
                'name': 'Create New Task',
                'res_model': 'cpm_odoo.planning_task',
                # 'domain': [],
                'view_id':self.env.ref("cpm_odoo.planning_task_create_view_form").id,
                'views':[(False,'form')],
                'context': {
                    'default_workflow_id':workflow_id
                },
                'target': 'new'
            }
        else:
            raise ValidationError(f"Cannot create task - The workflow {workflow.name} status is not in draft.")

    #task actions
    @api.model
    def act_get_active_tasks(self,domain,count=0,cols=[]):
        task_recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ('start_date','<',fields.Date.today()),
                ('task_status','=','active'),
                ('workflow_id.workflow_status','=','active')
            ] + domain,
            cols,
            0,count,
            "exp_end asc"
        )
        return task_recs

    @api.model
    def act_get_upcoming_tasks(self,domain,count=0,cols=[]):
        task_recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ('start_date','>',fields.Date.today()),
                ('task_status','=','active'),
                ('workflow_id.workflow_status','=','active')
            ] + domain,
            cols,
            0,count,
            "exp_end asc"
        )
        return task_recs

    @api.model
    def act_get_expiring_tasks(self,domain,count=0,cols=[]):
        one_week_later = (datetime.today() + timedelta(days=7)).date()

        task_recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ('start_date','<=',fields.Date.today()),
                ('exp_end','<=',one_week_later),
                ('task_status','=','active'),
                ('workflow_id.workflow_status','=','active')
            ] + domain,
            cols,
            0,count,
            "exp_end asc"
        )
        return task_recs

    @api.model
    def act_get_expired_tasks(self,domain,count=0,cols=[]):

        task_recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ('start_date','<=',fields.Date.today()),
                ('exp_end','<=',fields.Date.today()),
                ('task_status','=','active'),
                ('workflow_id.workflow_status','=','active')
            ] + domain,
            cols,
            0,count,
            "exp_end asc"
        )
        return task_recs
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            workflow_id = self.env.context['default_workflow_id']
            if(not workflow_id):
                workflow_id = val.get("workflow_id")
            workflow = self.env["cpm_odoo.planning_workflow"].browse(workflow_id)
            if(not workflow.workflow_status=="draft"):
                raise ValidationError(f"Cannot create task - The workflow {workflow.name} status is not in draft.")
        
        return super().create(vals)
    
    def write(self, vals):
        for rec in self:
            if rec.workflow_id.workflow_status != 'draft':
                for val in vals:
                    if val["start_date"] or val["exp_end"]:
                        raise ValidationError(f"Cannot change date of non-draft status task: Task {rec.name}")
        return super().write(vals)
    
    
    priority = fields.Selection(
        [
            ('normal', 'Normal'),
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical')
        ],
        string='priority',
        default="normal"
    )
        
class TaskCategory(models.Model):
    _name = 'cpm_odoo.planning_task_category'
    _description = "Task Categories"
    
    name = fields.Char(
        string = 'Category Name',
        size = 64,
        required=True
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
class TaskNoteCategory(models.Model):
    _name = 'cpm_odoo.planning_task_note_category'
    _description = "Expense Category"
    # _rec_name = "encoded_name"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
    display = fields.Boolean(
        string = 'Display',
        required=True,
        default=False
    )
    
class TaskChecklistItem(models.Model):
    _name = 'cpm_odoo.task_checklist_item'
    _description = "Task Checklist"
    
    task_id = fields.Many2one(
        comodel_name='cpm_odoo.planning_task', 
        string='task'
    )
    
    title = fields.Char(
        string = 'title',
        size=256,
        required=True
    )
    
    description = fields.Text(
        string='description'
    )
    
    is_completed = fields.Boolean(
        string='is_completed',
        default=False
    )

class TaskNote(models.Model):
    _name = 'cpm_odoo.planning_task_note'
    _description = "Task Notes"
    
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
    
    
    _inherits = {
        "cpm_odoo.finance_expense_record":"expense_id"
    }
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task',
        string='Task',
        required=True,
        ondelete = 'cascade'
    )
    
    expense_id = fields.Many2one(
        comodel_name = 'cpm_odoo.finance_expense_record', 
        string='expense',
        required=True,
        ondelete = "restrict"
    )
    
    expense_type = fields.Selection([
        ('base', 'Base Expense'),
        ('additional', 'Additional Expense')
    ], string='expense_type')
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            task_id = self.env.context.get("default_task_id")
            if not task_id:          
                task_id = val.task_id  
                
            task = self.env['cpm_odoo.planning_task'].browse()
            
            val["title"] = "Task Expense: " + val["title"]
            val["description"] = f"Workflow: {task.workflow_id.name}, Task: {task.name}" + val["description"] if val["description"] else ""
        return super().create(vals)