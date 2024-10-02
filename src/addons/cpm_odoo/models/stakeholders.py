from odoo import models, fields, api

class Stakeholder(models.AbstractModel):
    _name = "cpm_odoo.stakeholders_stakeholder"
    _description = ""
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )

    description = fields.Text(
        string = 'Description'
    )
    
    email = fields.Char(
        string = 'Email',
        size = 240
    )
    
    phone_number = fields.Char(
        string = 'Phone Number',
        size = 64
    )
    
    address = fields.Char(
        string = 'Address',
        size = 1024
    )
    
    image = fields.Image(
        string = 'Image', 
        max_width = 512, 
        max_height= 512
    )
    
class Contractor(models.Model):
    _name = "cpm_odoo.stakeholders_contractor"
    _description = ""
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_contractor_category', 
        string='Category',
        ondelete = "restrict"
    )
    
class ContractorCategory(models.Model):
    _name = "cpm_odoo.stakeholders_contractor_category"
    _description = ""
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 64
    )
    
class Investor(models.Model):
    _name = "cpm_odoo.stakeholders_investor"
    _description = ""
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
class OtherContacts(models.Model):
    _name = "cpm_odoo.stakeholders_other_contacts"
    _description = ""
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
class Supplier(models.Model):
    _name = 'cpm_odoo.stakeholders_supplier'
    _description = ''
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    