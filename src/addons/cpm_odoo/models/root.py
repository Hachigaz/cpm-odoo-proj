from odoo import models, fields, api


class ProjectHRM(models.Model):
    _name = "cpm_odoo.root_project_hrm"
    _description = "Project HRM"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project'
    )
    
    project_staff_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='Staffs',
        relation = "project_assigned_staffs",
        column1 = "hrm_id",
        column2 = "staff_id"
    )
    
    # @api.onchange("project_staff_ids")
    # def _onchange_staff_ids(self):
    #     current_ids = self.project_staff_ids.ids
    #     previous_ids = self.env['cpm_odoo.human_res_staff'].browse(self.id).project_staff_ids.ids
        
    #     # added_ids = set(current_ids) - set(previous_ids)
    #     # if added_ids:
    #     #     pass
        
        
    #     removed_ids = set(previous_ids) - set(current_ids)
    #     if removed_ids:
    #         for id in removed_ids:
    #             if(self.env["cpm_odoo.planning_task"].)
    #         pass
    
    # assigned_accountant_ids = fields.Many2many(
    #     comodel_name = 'cpm_odoo.human_res_staff',
    #     string='Assigned Accountants'
    # )
    
    # assigned_qcs = fields.Many2many(
    #     comodel_name = 'cpm_odoo.human_res_staff', 
    #     string='assigned_qcs'
    # )
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result


class ProjectPlanning(models.Model):
    _name = "cpm_odoo.root_project_planning"
    _description = "Project Planning"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project'
    )
    
    workflow_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_workflow', 
        inverse_name = 'planning_id',
        string='Workflows'
    )
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result

class ProjectFinance(models.Model):
    _name = "cpm_odoo.root_project_finance"
    _description = "Model"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project'
    )
    
    investment_record_ids = fields.One2many(
        comodel_name = 'cpm_odoo.finance_investment_record', 
        inverse_name = 'project_finance_id', 
        string='Investments'
    )
    
    expense_record_ids = fields.One2many(
        comodel_name = 'cpm_odoo.finance_expense_record', 
        inverse_name = 'project_finance_id', 
        string='Expenses'
    )
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result

class ProjectDocMgmt(models.Model):
    _name = "cpm_odoo.root_project_doc_mgmt"
    _description = "Model"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project'
    )
    
    attached_document_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.documents_document_set', 
        string='Attached Documents',
        relation = 'cpm_odoo_proj_doc_mgmt_doc_set'
    )
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result

class Project(models.Model):
    _name = "cpm_odoo.root_project"
    _description = "Model"
    
    short_name = fields.Char(
        string = 'Short Name (64)',
        required=True,
        size = 64
    )
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 512
    )

    description = fields.Text(
        string = 'Description'
    )
    
    start_date = fields.Date(
        string = 'Start Date',
        required=True,
        default = fields.Date.today()
    )
    
    exp_end = fields.Date(
        string = 'Expected End Date'
    )
    
    manager_ids = fields.Many2many(
        'cpm_odoo.human_res_staff', 
        string='Project Managers',
        relation = 'cpm_odoo_root_proj_hr_mngrs',
        required=True
    )
    
    investor_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_investor', 
        string='Investors',
        relation = 'cpm_odoo_root_proj_stk_investor',
    )
    
    other_contact_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_other_contacts', 
        string='Other Contacts',
        relation = 'cpm_odoo_root_proj_stk_other_contact',
    )
    
    _inherits = {
        "cpm_odoo.root_project_hrm":"proj_hrm_id",
        "cpm_odoo.root_project_planning":"proj_planning_id",
        "cpm_odoo.root_project_finance":"proj_finance_id",
        "cpm_odoo.root_project_doc_mgmt":"proj_doc_id"
    }
    
    proj_hrm_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_hrm', 
        string='HRM Management',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    proj_planning_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_planning', 
        string='Planning',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    proj_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='Finance',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    proj_doc_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_doc_mgmt', 
        string='Documents',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    @api.model_create_multi
    def create(self, vals):
        record = super().create(vals)
        record.proj_hrm_id.project_id = record.id
        record.proj_planning_id.project_id = record.id
        record.proj_finance_id.project_id = record.id
        record.proj_doc_id.project_id = record.id
        return record