from odoo import models, fields, api



class ProjectPlanning(models.Model):
    _name = "cpm_odoo.root_project_planning"
    _description = ""
    
    workflow_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_workflow', 
        inverse_name = 'planning_id',
        string='Workflows'
    )

class ProjectFinance(models.Model):
    _name = "cpm_odoo.root_project_finance"
    _description = ""
    
class ProjectResMgmt(models.Model):
    _name = "cpm_odoo.root_project_res_mgmt"
    _description = ""
    
class ProjectDocMgmt(models.Model):
    _name = "cpm_odoo.root_project_doc_mgmt"
    _description = ""
    
    document_set_ids = fields.One2many(
        comodel_name = 'cpm_odoo.documents_document_set', 
        inverse_name = 'project_doc_mgmt_id', 
        string='document_set'
    )

class ProjectStakeholderMgmt(models.Model):
    _name = "cpm_odoo.root_project_stakeholders_mgmt"
    _description = ""
    
    investor_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.contractors_investor', 
        string='Investors'
    )
    
    other_contact_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.contractors_other_contacts', 
        string='Other Contacts'
    )

class Project(models.Model):
    _name = "cpm_odoo.root_project"
    _description = ""
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    date_created = fields.Date(
        string = 'date_created',
        default = fields.Date.today(),
        readonly = True
    )
    
    manager_ids = fields.Many2many(
        'cpm_odoo.human_res_staff', 
        string='Manangers',
        required=True
    )
    
    _inherits = {
        "cpm_odoo.root_project_planning":"planning_id",
        "cpm_odoo.root_project_finance":"finance_id",
        "cpm_odoo.root_project_res_mgmt":"res_mgmt_id"
    }
    
    planning_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_planning', 
        string='Planning',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='Finance',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )

    res_mgmt_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_res_mgmt', 
        string='Resources',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )