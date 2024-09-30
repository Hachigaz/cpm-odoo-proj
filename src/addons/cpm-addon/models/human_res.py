from odoo import models, fields, api

class Staff(models.Model):
    _name = "cpm_odoo.human_res_staff"
    _description = ""
    
    first_name = fields.Char(
        String = 'First Name',
        required=True,
        size = 64
    )
    
    last_name = fields.Char(
        String = 'Last Name',
        required=True,
        size = 64
    )
    
    _inherits = {
        "res.users":"user_id"
    }
    
    user_id = fields.Many2one(
        comodel_name = 'res.users', 
        string='User'
    )
    
    _sql_constraints = [
        ('Email', 'UNIQUE(user_email)', 'The email must be unique.')
    ]