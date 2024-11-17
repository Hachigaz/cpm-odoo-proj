from odoo import models, fields, api

class Stakeholder(models.AbstractModel):
    _name = "cpm_odoo.stakeholders_stakeholder"
    _description = "Model"
    
    _inherits = {
        "res.partner":"partner_id"
    }
    
    partner_id = fields.Many2one(
        comodel_name = 'res.partner', 
        string='Partner',
        required=True,
        ondelete="restrict"
    )
    
    # name = fields.Char(
    #     string = 'Name'
    # )

    description = fields.Text(
        string = 'Description'
    )
    
    address = fields.Char(
        string = 'Address',
        size = 1024
    )
    
class Contractor(models.Model):
    _name = "cpm_odoo.stakeholders_contractor"
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
    category_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_contractor_category', 
        string='Category',
        relation='cpm_odoo_contractor_cate_contractor',
        column1="contractor_cate_contractor_id",
        column2="contractor_cate_category_id"
    )
    
class ContractorCategory(models.Model):
    _name = "cpm_odoo.stakeholders_contractor_category"
    _description = "Model"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 64
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
    
class Investor(models.Model):
    _name = "cpm_odoo.stakeholders_investor"
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
class OtherContacts(models.Model):
    _name = "cpm_odoo.stakeholders_other_contacts"
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
class Supplier(models.Model):
    _name = 'cpm_odoo.stakeholders_supplier'
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    