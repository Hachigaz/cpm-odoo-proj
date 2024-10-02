from odoo import models, fields, api

class Staff(models.Model):
    _name = "cpm_odoo.human_res_staff"
    _description = ""
    
    first_name = fields.Char(
        string = 'First Name',
        required=True,
        size = 64
    )
    
    last_name = fields.Char(
        string = 'Last Name',
        required=True,
        size = 64
    )
    
    employed_on = fields.Date(
        string = 'Employed On',
        default = fields.Date.today()    
    )
    
    department_id = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_department', 
        string='Department'
    )
    
    _inherits = {
        "res.users":"user_id"
    }
    
    user_id = fields.Many2one(
        comodel_name = 'res.users', 
        string='User',
        required=True,
        ondelete = "restrict"
    )
    
class Department(models.Model):
    _name = 'cpm_odoo.human_res_department'
    _description = ''
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    