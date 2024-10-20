from odoo import models, fields, api



class ProjectPlanning(models.Model):
    _name = "cpm_odoo.root_project_planning"
    _description = "Model"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project'
    )
    
    workflow_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_workflow', 
        inverse_name = 'planning_id',
        string='Workflows'
    )
    
    assigned_qcs = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='assigned_qcs'
    )

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
        "cpm_odoo.root_project_planning":"proj_planning_id",
        "cpm_odoo.root_project_finance":"proj_finance_id",
        "cpm_odoo.root_project_doc_mgmt":"proj_doc_id"
    }
    
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
        record.proj_planning_id.project_id = record.id
        record.proj_finance_id.project_id = record.id
        record.proj_doc_id.project_id = record.id
        return record