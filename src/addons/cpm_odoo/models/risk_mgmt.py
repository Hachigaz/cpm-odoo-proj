from odoo import models, fields, api 

class Risk(models.Model):
    _name = "cpm_odoo.risk_mgmt_issue"
    _description = ""
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.risk_mgmt_issue_category', 
        string='Category',
        required=True
    )
    
class RiskCategory(models.Model):
    _name = "cpm_odoo.risk_mgmt_issue_category"
    _description = ""
    
    name = fields.Char(
        string = 'name',
        size=128,
        required=True
    )


class Issue(models.Model):
    _name = "cpm_odoo.risk_mgmt_issue"
    _description = ""
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.risk_mgmt_issue_category', 
        string='Category',
        required=True
    )
    
    is_resolved = fields.Boolean(
        string = 'Is Resolved',
        default = False
    )

class IssueCategory(models.Model):
    _name = "cpm_odoo.risk_mgmt_issue_category"
    _description = ""
    
    name = fields.Char(
        string = 'name',
        size=128,
        required=True
    )