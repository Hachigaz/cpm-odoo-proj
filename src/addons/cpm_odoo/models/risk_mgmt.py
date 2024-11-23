from odoo import models, fields, api 

class Risk(models.Model):
    _name = "cpm_odoo.risk_mgmt"
    _description = "Model"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.risk_mgmt_category', 
        string='Category',
        required=True
    )

    priority = fields.Selection(
        [
            ("0", "Normal"),
            ("1", "Low"),
            ("2", "Medium"),
            ("3", "High")
        ],
        string = "Priority",
        store = True
    )
    
    project_id = fields.Many2one(
        comodel_name = "cpm_odoo.root_project",
        string = "Project",
        required = True
    )

    def action_view_solutions(self):
        self.ensure_one()
        
        view_id = self.env.ref("cpm_odoo.risk_mgmt_solution_create_form").id

        return {
            'type': 'ir.actions.act_window',
            'name': 'Solutions',
            'res_model': 'cpm_odoo.risk_mgmt_solution',
            'view_mode': 'tree,form',
            'views': [
                [False, 'tree'],
                [view_id, 'form'],
            ],
            'domain': [('risk_id', '=', self.id)],
            'context': {
                'default_risk_id': self.id 
            },
            'target': 'current',
        }

    
class RiskCategory(models.Model):
    _name = "cpm_odoo.risk_mgmt_category"
    _description = "Model"
    
    name = fields.Char(
        string = 'name',
        size=128,
        required=True
    )
    
class Solution(models.Model):
    _name = "cpm_odoo.risk_mgmt_solution"
    _description = "Model"

    name = fields.Char(
        string = 'Name',
        size = 128,
        required = True
    )

    description = fields.Text(
        string = "Description"
    )

    risk_id = fields.Many2one(
        comodel_name = "cpm_odoo.risk_mgmt",
        string = "Risk",
        required = True
    )

    

class Issue(models.Model):
    _name = "cpm_odoo.risk_mgmt_issue"
    _description = "Model"
    
    name = fields.Char(
        string = 'Name',
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
    _description = "Model"
    
    name = fields.Char(
        string = 'name',
        size=128,
        required=True
    )