from odoo import models, fields, api

class Staff(models.Model):
    _name = "cpm_odoo.human_res_staff"
    _description = "Model"
    
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
    
    full_name = fields.Char(
        compute='_compute_full_name', 
        string='full_name',
        store=True
    )
    
    @api.depends('first_name','last_name')
    def _compute_full_name(self):
        for record in self:
            record.full_name = record.first_name + " " + record.last_name
        pass
    
    employed_on = fields.Date(
        string = 'Employed On',
        default = fields.Date.today()    
    )
    
    department_id = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_department', 
        string='Department',
        auto_join=True
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
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            val["name"] = val["first_name"].lower() + " " + val["last_name"].lower()
        return super().create(vals)
    
    # def unlink(self):
    #     # Get the parent record from the child
    #     user_rec = self.mapped('user_id')

    #     # First, unlink the child record(s)
    #     result = super().unlink()

    #     # Now, unlink the corresponding parent record(s)
    #     user_rec.unlink()

    #     return result

    
class Department(models.Model):
    _name = 'cpm_odoo.human_res_department'
    _description = "Model"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    department_role_id = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_department_role', 
        string='Role'
    )
    
class DepartmentRole(models.Model):
    _name = 'cpm_odoo.human_res_department_role'
    _description = "Model"
    