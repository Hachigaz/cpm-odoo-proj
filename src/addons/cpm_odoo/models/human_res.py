from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json

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
    
    employed_on = fields.Date(
        string = 'Employed On',
        default = fields.Date.today()    
    )
    
    department_id = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_department', 
        string='Department',
        auto_join=True
    )
    department_name = fields.Char(
        'department_name',
        related="department_id.name"
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
            val["name"] = val["first_name"] + " " +  val['last_name']
        return super().create(vals)
    
    
    def update_name(self):
        for record in self:
            self.name = self.first_name + self.last_name
    
    @api.onchange('first_name')
    def _onchange_first_name(self):
        self.update_name()
        pass
    
    @api.onchange('last_name')
    def _onchange_last_name(self):
        self.update_name()
        pass
    
    # def unlink(self):
    #     # Get the parent record from the child
    #     user_rec = self.mapped('user_id')

    #     # First, unlink the child record(s)
    #     result = super().unlink()

    #     # Now, unlink the corresponding parent record(s)
    #     user_rec.unlink()

    #     return result

    @api.model
    def find_staff_by_user_id(self,uid):
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            [
                ['user_id','=',uid]
            ],
            [],
            0,1,""
        )
        
        staff_rec = staff_rec[0] if staff_rec else None
        
        return staff_rec
    
    def act_check_in_group(self,xml_id):
        result = []
        for record in self:
            if record.sudo().user_id.has_group(xml_id):
                result.append({
                    'staff_id':record.id,
                    'is_in_group':True
                })
            else:
                result.append({
                    'staff_id':record.id,
                    'is_in_group':False
                })
                
        return result
    
    def call_action(self):
        model_name = self.env.context.get("call_model_name")
        model_func = self.env.context.get("call_model_func")
        params = self.env.context.get("call_model_params")
        
        # raise ValidationError(json.dumps([model_name,model_func,params]))
        
        result = getattr(self.env[model_name].sudo(),model_func)
        result(*params)
        
        
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