from odoo import models,fields,api
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta
import json

class Workflow(models.Model):
    _name = "cpm_odoo.planning_workflow"
    _description = "Workflow"
    
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
    
    overdue_verified_task_count = fields.Integer(
        string = 'Overdue Verified Task Count',
        compute = '_compute_overdue_verified_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status','task_ids.is_overdue')
    def _compute_overdue_verified_task_count(self):
        for record in self:
            overdue_verified_task_count = sum(1 for task in record.task_ids if task.task_status == "verified" and task.is_overdue)
            record.overdue_verified_task_count = overdue_verified_task_count
        pass
    
    overdue_task_count = fields.Integer(
        string = 'Overdue Task Count',
        compute = '_compute_overdue_task_count',
        store=True
    )
    
    @api.depends('task_ids.task_status','task_ids.is_overdue')
    def _compute_overdue_task_count(self):
        for record in self:
            overdue_task_count = sum(1 for task in record.task_ids if task.task_status != "verified" and task.is_overdue)
            record.overdue_task_count = overdue_task_count
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
        if(workflow.task_count > 0):
            raise ValidationError(f"The workflow {workflow.name} has no task yet.")
        if(workflow.unassigned_task_count>0):
            raise ValidationError(f"The workflow {workflow.name} has unassigned tasks.")
        for rec in workflow.task_ids:
            if rec.unattached_contractor_count > 0:
                raise ValidationError(f"The workflow {workflow.name} has tasks ({rec.name}) with contractors without attached contracts")
        #set active status
        if workflow.workflow_status =='draft':
            workflow.workflow_status = 'active'
            return True
        else:
            raise ValidationError(f"The workflow {workflow.name} is not in draft status.")
            return False
        pass
    
    @api.model
    def mark_finished(self, workflow_id):
        workflow = self.env["cpm_odoo.planning_workflow"].browse(workflow_id)
        #check for unverified tasks
        #set end date and set finished status
        workflow.end_date = fields.Date.today()
        workflow.workflow_status = 'finished'

        
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
    
    @api.depends('task_ids.assigned_contractor_count','task_ids.assigned_staff_count')
    def _compute_unassigned_task_count(self):
        for record in self:
            unassigned_task_count = sum(1 for task in record.task_ids if len(task.assigned_staff_ids) == 0 and len(task.assigned_contractor_ids) == 0)
            record.unassigned_task_count = unassigned_task_count
        pass
   
class TaskAssign_Abs(models.Model):
    _name = "cpm_odoo.planning_task_assign_abs"
    _description = "TaskAssignContractor"
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task', 
        string='task',
        ondelete="cascade",
        required=True
    )
    
class TaskAssignContractor(models.Model):
    _name = "cpm_odoo.planning_task_assign_contractor"
    _description = "TaskAssignContractor"
    
    _inherit=["cpm_odoo.planning_task_assign_abs"]
    
    contractor_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_contractor', 
        string='contractor',
        ondelete="restrict",
        required=True
    )
    
    contract_set_id = fields.Many2one(
        comodel_name = 'cpm_odoo.contracts_contract_set',
        string='contract_set',
        ondelete="restrict",
        default=None
    )
    
    contractor_name = fields.Char('contractor_name',related="contractor_id.name")
    # contractor_category_ids = fields.Many2many(
    #     'contractor_category_ids',
    #     related="contractor_id.contractor_category_ids"
    # )
    
    @api.constrains('contract_set_id')
    def _constrains_contract_set_id(self):
        if(self.contract_set_id.contractor_id.id != self.contractor_id.id):
            raise ValidationError("Attached contract does not have the same contractor as the assigned contractor in the task.")
        pass
    
class TaskAssignStaff(models.Model):
    _name = "cpm_odoo.planning_task_assign_staff"
    _description = "TaskAssignStaff"
    
    _inherit=["cpm_odoo.planning_task_assign_abs"]
    
    staff_id = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='staff'
    )
    
    staff_name = fields.Char('staff_name',related="staff_id.name")
    department_name = fields.Char('department_name',related="staff_id.department_id.name")
   
class Task(models.Model):
    _name = "cpm_odoo.planning_task"
    _description = "Task"
    
    project_id = fields.Many2one(
        related="workflow_id.planning_id.project_id", 
        string='project'
    )
    
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
    
    date_completed = fields.Datetime(
        'date_completed',
        default=None
    )
    
    date_verified = fields.Datetime(
        'date_verified',
        default=None
    )
    
    verification_id = fields.Many2one(
        'cpm_odoo.planning_task_qa_verification', 
        string='verification'
    )
    
    @api.model
    def act_mark_completed(self, task_id):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        if(task.task_status == "active"):
            task.task_status = "completed"
            task.date_completed = fields.Datetime.now()
            
            staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
            task.add_log(
                f"{staff_rec.get('name') if staff_rec else ''} marked the task as completed.",
                staff_rec.get('id') if staff_rec else None
            )
            return True
        else:
            raise ValidationError("The task status is not completed.")
        pass
    
    def act_verify_task(self):
        for task in self:
            if(task.task_status == "completed"):
                task.task_status = "verified"
                task.date_verified = fields.Datetime.now()
                task.end_date = fields.Datetime.now()
                
                staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
                task.add_log(
                    f"{staff_rec.get('name') if staff_rec else ''} verified the task.",
                    staff_rec.get('id') if staff_rec else None
                )

                workflow_finished = True
                for t_rec in task.workflow_id.task_ids:
                    if t_rec.task_status != "verified":
                        workflow_finished = False
                if workflow_finished:
                    t_rec.workflow_id.mark_finished(t_rec.workflow_id.id)
            else:
                raise ValidationError("The task status is not completed.")
        pass
    
    def act_reject_completion(self):
        for task in self:
            if(task.task_status == "completed"):
                task.task_status = "active"
                task.date_completed=None
                
                staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
                task.add_log(
                    f"{staff_rec.get('name') if staff_rec else ''} rejected the task completion.",
                    staff_rec.get('id') if staff_rec else None
                )
            else:
                raise ValidationError("The task status is not completed.")
        pass
    
    is_overdue = fields.Boolean(compute='_compute_is_overdue', string='is_overdue',store=True)
    
    @api.depends('exp_end','end_date')
    def _compute_is_overdue(self):
        for rec in self:
            if not rec.end_date:
                today = fields.Date.context_today(self)
                day_after_today = today + timedelta(days=1)
                
                rec.is_overdue = day_after_today >= rec.exp_end
            else:
                rec.is_overdue = rec.exp_end < rec.end_date
        pass
    
    assigned_staff_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task_assign_staff', 
        inverse_name = 'task_id', 
        string='Assigned Staffs'
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
        
        for staff in staff_recs:
            if not self.is_user_in_proj(task.workflow_id.planning_id.project_id.id,staff.id):
                staff.user_id.write({
                    'groups_id':[(4,task.workflow_id.planning_id.project_id.proj_mem_group_id.id)]
                })

        task.write({
            "assigned_staff_ids":[(0,0,{
                "staff_id":id
            }) for id in staff_ids]
        })
            
            
        cur_staff = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        task.add_log(
            f"{', '.join(staff.name for staff in staff_recs)} was assigned to the task.",
            cur_staff.get('id') if cur_staff else None
        )
    
    @api.model
    def act_unassign_staffs_to_task(self,task_id,staff_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        task.act_unassign_task_head_member(staff_ids)
        
        staff_recs = self.env["cpm_odoo.planning_task_assign_staff"].search(
            [
                ['task_id','=',task.id],
                ['staff_id','in',staff_ids]
            ]
        )
        
        cur_staff = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        task.add_log(
            f"{', '.join(staff.staff_id.name for staff in staff_recs)} was unassigned from the task.",
            cur_staff.get('id') if cur_staff else None
        )
        
        for staff in staff_recs:
            if not self.is_user_in_proj(task.workflow_id.planning_id.project_id.id,staff.id):
                staff.user_id.write({
                    'groups_id':[(3,task.workflow_id.planning_id.project_id.proj_mem_group_id.id)]
                })
        
        # raise ValidationError(json.dumps([f"{staff.staff_id.name},{staff.id},{staff.staff_id.id}" for staff in staff_recs]+[f"{staff.staff_id.name},{staff.id},{staff.staff_id.id}" for staff in task.assigned_staff_ids]))

        assigned_ids = [rec.id for rec in task.assigned_staff_ids if rec.staff_id.id in staff_ids]
        task.write({
            "assigned_staff_ids":[[2,id] for id in assigned_ids],
        })
        pass
    
    def act_assign_task_head_member(self,staff_ids):
        staff_recs = self.env["cpm_odoo.human_res_staff"].browse(staff_ids)
        for record in self:
            for staff_rec in staff_recs:
                if not record.is_user_in_task(staff_rec.user_id.id):
                    raise ValidationError(f'Cannot set {staff_rec.name} as head task member, they are not assigned to the task {record.name}.')
        
        head_mem_gr = self.env.ref('cpm_gr.project_head_mem_gr')
        for staff in staff_recs:
            staff.user_id.write({
                'groups_id':[(4,head_mem_gr.id)]
            })
            
        cur_staff = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        # self.add_log(
        #     f"{', '.join(staff.name for staff in staff_recs)} was appointed to be task leader.",
        #     cur_staff.get('id') if cur_staff else None
        # )
        pass
        
    def act_unassign_task_head_member(self,staff_ids):
        staff_recs = self.env["cpm_odoo.human_res_staff"].browse(staff_ids)
        head_mem_gr = self.env.ref('cpm_gr.project_head_mem_gr')
        for staff in staff_recs:
            staff.user_id.write({
                'groups_id':[(3,head_mem_gr.id)]
            })
            
        cur_staff = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        # self.add_log(
        #     f"{', '.join(staff.name for staff in staff_recs)} was dismissed from task leader role.",
        #     cur_staff.get('id') if cur_staff else None
        # )
        pass
    
    @api.model
    def is_user_in_proj(self,project_id,user_id):
        recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ['assigned_staff_ids','in',user_id],
                ['workflow_id.planning_id.project_id.id',"=",project_id]
            ]
        )
        
        if(len(recs)>0):
            return True
        else:
            return False
        pass
    
    def is_user_in_task(self,user_id):
        for record in self:
            if(any(staff for staff in record.assigned_staff_ids if staff.staff_id.user_id.id == user_id)):
                return True
            else:
                return False
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
    
    unattached_contractor_count = fields.Integer(
        string = 'Unattached Contract Contractor Count',
        compute = '_compute_unattached_contractor_count',
        store=True
    )
    
    @api.depends('assigned_contractor_ids.contract_set_id.document_count')
    def _compute_unattached_contractor_count(self):
        for record in self:
            record.unattached_contractor_count = sum([1 for rec in record.assigned_contractor_ids if rec.contract_set_id == None or rec.contract_set_id.document_count == 0])
        pass
    
    @api.model
    def act_assign_contractors_to_task(self,task_id,contractor_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        contractor_recs = self.env["cpm_odoo.stakeholders_contractor"].search([["id",'in',contractor_ids]])

        task.write(
            {
                "assigned_contractor_ids":[
                    (0,0,{
                        "contractor_id":contractor_id
                    }) for contractor_id in contractor_ids
                ],
            
                "task_log_ids":[(0,0,{
                    "title":f"Contractor {contractor.name} was assigned to the task.",
                    "staff_id":None
                }) for contractor in contractor_recs]
            }
        )
        
        cur_staff = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        task.add_log(
            f"{', '.join(contractor.name for contractor in contractor_recs)} was assigned to the task.",
            cur_staff.get('id') if cur_staff else None
        )
        pass
    
    @api.model
    def act_unassign_contractors_to_task(self,task_id,contractor_ids):
        task = self.env["cpm_odoo.planning_task"].browse(task_id)
        
        contractor_recs = self.env["cpm_odoo.stakeholders_contractor"].search([["id",'in',contractor_ids]])
        
        cur_staff = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        task.add_log(
            f"{', '.join(contractor.name for contractor in contractor_recs)} was assigned to the task.",
            cur_staff.get('id') if cur_staff else None
        )
        
        assigned_ids = [rec.id for rec in task.assigned_contractor_ids if rec.contractor_id.id in contractor_ids]
        task.write({
            "assigned_contractor_ids":[[2,id] for id in assigned_ids],
            
            "task_log_ids":[(0,0,{
                "title":f"Contractor {contractor.name} was unassigned from the task.",
                "staff_id":None
            }) for contractor in contractor_recs]
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
                ('start_date','<=',fields.Date.today()),
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

    @api.model
    def act_get_completed_tasks(self,domain,count=0,cols=[]):

        task_recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ('task_status','=','completed'),
            ] + domain,
            cols,
            0,count,
            "exp_end asc"
        )
        return task_recs

    @api.model
    def act_get_verified_tasks(self,domain,count=0,cols=[]):

        task_recs = self.env["cpm_odoo.planning_task"].search_read(
            [
                ('task_status','=','verified'),
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
        
        recs = super().create(vals)

        for rec in recs:
            staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
            rec.add_log(
                f"{staff_rec.name if staff_rec else ''} created the task",
                staff_rec.get('id') if staff_rec else None
            )

        return recs
    
    def write(self, vals):
        for rec in self:
            if rec.workflow_id.workflow_status != 'draft':
                if vals.get("start_date") or vals.get("exp_end") or vals.get('depends_on'):
                    raise ValidationError(f"Cannot change date of non-draft status task: Task {rec.name}")
        return super().write(vals)

    def add_log(self,title,staff_id):
        for record in self:
            record.sudo().write({
                "task_log_ids":[(0,0,{
                    "title":title,
                    "staff_id":staff_id if staff_id else None
                })]
            })
    
    
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
    
    date_created = fields.Date(
        'date_created',
        default=fields.Date.today()
    )
        
    task_note_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_task_note', 
        inverse_name = 'task_id', 
        string='Notes'
    )
    
    task_checklist_ids = fields.One2many(
        'cpm_odoo.task_checklist_item', 
        inverse_name = 'task_id', 
        string='task_checklist'
    )
    
    task_log_ids = fields.One2many(
        'cpm_odoo.task_history_log', 
        inverse_name = 'task_id', 
        string='task_log'
    )
        
class TaskCategory(models.Model):
    _name = 'cpm_odoo.planning_task_category'
    _description = "Task Categories"
    
    name = fields.Char(
        string = 'Category Name',
        size = 64,
        required=True
    )
    
    # workflow_id = fields.Many2one(
    #     'cpm_odoo.planning_workflow', 
    #     string='workflow',
    #     ondelete="cascade"
    # )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
class TaskNoteCategory(models.Model):
    _name = 'cpm_odoo.planning_task_note_category'
    _description = "Task Note Category"
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
    
class TaskChecklistItem(models.Model):
    _name = 'cpm_odoo.task_checklist_item'
    _description = "Task Checklist"
    
    task_id = fields.Many2one(
        comodel_name='cpm_odoo.planning_task', 
        string='task',
        required=True,
        ondelete="cascade"
    )
    
    title = fields.Char(
        string = 'title',
        size=256,
        required=True
    )
    
    assigned_staffs = fields.Many2many(
        comodel_name = 'cpm_odoo.planning_task_assign_staff', 
        string='assigned_staffs',
        relation="cpm_assigned_task_checklist_assigned_staff",
        column1="tid",
        column2="sid"
    )
    
    @api.constrains('assigned_staffs')
    def _constrains_assigned_staffs(self):
        for rec in self.assigned_staffs:
            if self.task_id.id != rec.task_id.id:
                raise ValidationError("Cannot assign checklist to staff not in assigned staff list.")
        pass
    
    assigned_contractors = fields.Many2many(
        comodel_name = 'cpm_odoo.planning_task_assign_contractor', 
        string='assigned_contractors',
        relation="cpm_assigned_task_checklist_assigned_contractors",
        column1="tid",
        column2="cid"
    )
    
    @api.constrains('assigned_contractors')
    def _constrains_assigned_contractors(self):
        for rec in self.assigned_contractors:
            if self.task_id.id != rec.task_id.id:
                raise ValidationError("Cannot assign checklist to staff not in assigned staff list.")
        pass
    
    description = fields.Text(
        string='description'
    )
    
    is_completed = fields.Boolean(
        string='is_completed',
        default=False
    )
    
    date_created = fields.Datetime(
        'date_created',
        default=fields.Datetime.now(),
        required=True
    )
    
    def mark_completed(self):
        self.is_completed = True
        staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        self.task_id.add_log(
            f"Marked the task checklist {self.title} as completed",
            staff_rec.get('id') if staff_rec else None
        )
        return True
        
    
    def mark_reset(self):
        staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        self.is_completed = False

        self.task_id.add_log(
            f"Marked the task checklist {self.title} as incomplete",
            staff_rec.get('id') if staff_rec else None
        )
        return True
    
    due_date = fields.Date(
        'due_date',
        required=True
    )
    
    @api.constrains('due_date')
    def _constrains_due_date(self):
        if(self.due_date<self.task_id.start_date):
            raise ValidationError(f'Due Date cannot be before the task start date (f{self.task_id.start_date}).')
        if(self.due_date > self.task_id.exp_end):
            raise ValidationError(f'Due Date cannot be after the task expected due date (f{self.task_id.exp_end}).')
        pass
    
    @api.constrains('assigned_staffs','assigned_contractors')
    def _constrains_assigned_mems(self):
        if len(self.assigned_staffs) + len(self.assigned_contractors) == 0:
            raise ValidationError(f"Checklist must have staffs or contractors assigned to it.")
        pass
    
    task_mem_gr_id = fields.Many2one(
        'res.groups', 
        string='task_mem_gr',
        ondelete="cascade"
    )
    
    task_head_gr_id = fields.Many2one(
        'res.groups', 
        string='task_head_gr',
        ondelete="cascade"
    )
    
    @api.model_create_multi
    def create(self, vals):
        staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        self.task_id.add_log(
            f"Created checklist {', '.join(val.get('title') for val in vals)}",
            staff_rec.get('id') if staff_rec else None
        )
        return super().create(vals)
    
    def unlink(self):
        for record in self:
            if self.is_completed:
                raise ValidationError("Cannot delete checklist item that has completed")
        
        staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        self.task_id.add_log(
            f"Deleted checklist {', '.join(rec.title for rec in self)}",
            staff_rec.get('id') if staff_rec else None
        )
        
        return super().unlink()
    
class TaskHistoryLogItem(models.Model):
    _name = 'cpm_odoo.task_history_log'
    _description = "Task History Log"
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task',
        string='Task',
        required=True,
        ondelete = 'cascade'
    )
    
    title = fields.Text(
        'title',
        required=True
    )

    date_logged = fields.Datetime(
        'date_logged',
        default=fields.Datetime.now(),
        required=True
    )
    
    staff_id = fields.Many2one(
        'cpm_odoo.human_res_staff', 
        string='staff',
        ondelete="set null"
    )

class TaskNote(models.Model):
    _name = 'cpm_odoo.planning_task_note'
    _description = "Task Note"
    
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
    
    category_id = fields.Many2one(
        'cpm_odoo.planning_task_note_category', 
        string='category',
        ondelete="cascade",
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
        string='Posted By'
    )
    
    @api.model_create_multi
    def create(self, vals):
        staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
        for val in vals:
            val['created_by'] = staff_rec.get('id') if staff_rec else None
        return super().create(vals)

class TaskComment(models.Model):
    _name = 'cpm_odoo.planning_task_comment'
    _description = "Task Note"
    
    task_id = fields.Many2one(
        comodel_name = 'cpm_odoo.planning_task',
        string='Task',
        required=True,
        ondelete = 'cascade'
    )
    
    comment = fields.Text(
        string = 'Comment'
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
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            staff_rec = self.env["cpm_odoo.human_res_staff"].find_staff_by_user_id(self.env.user.id)
            if staff_rec:
                val['created_by'] = staff_rec['id']
            else:
                raise ValidationError("Cannot find staff from current user")
            
        return super().create(vals)

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
        ondelete = "cascade"
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
    
    
class TaskQA_Verification(models.Model):
    _name = 'cpm_odoo.planning_task_qa_verification'
    _description = "Task QA Verification"
    
    task_note_id = fields.Many2one(
        'cpm_odoo.planning_task_note', 
        string='task_note',
        required=True,
        ondelete='cascade'
    )
    
    completion_quality = fields.Selection([
        ('poor', 'Poor'),
        ('fair', 'Fair'),
        ('good', 'Good'),
        ('very_good', 'Very Good'),
        ('excellent', 'Excellent')
    ], string='completion_quality',required=True)
    
    _inherits = {
        "cpm_odoo.planning_task_note":"task_note_id"
    }
        
    @api.model_create_multi
    def create(self, vals):
        recs = super().create(vals)
        for rec in recs:
            rec.task_id.verification_id = rec.id
            rec.task_id.act_verify_task()
        return recs
    
class TaskQA_Rejection(models.Model):
    _name = 'cpm_odoo.planning_task_qa_rejection'
    _description = "Task QA Rejection"
    
    task_note_id = fields.Many2one(
        'cpm_odoo.planning_task_note', 
        string='task_note',
        required=True,
        ondelete='cascade'
    )
    
    _inherits = {
        "cpm_odoo.planning_task_note":"task_note_id"
    }
    
    @api.model_create_multi
    def create(self, vals):
        recs = super().create(vals)
        for rec in recs:
            rec.task_id.act_reject_completion()
        return recs