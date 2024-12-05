from odoo import models, fields, api 
from odoo.exceptions import ValidationError
from datetime import datetime
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
        default=None
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
    _description = "Risk Category"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
class Solution(models.Model):
    _name = "cpm_odoo.risk_mgmt_solution"
    _description = "Solution"

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

    level = fields.Selection(
        [
            ("minor", "Minor"),
            ("moderate", "Moderate"),
            ("major", "Major"),
            ("critical", "Critical")
        ],
        string = "Level",
        store = True
    )
    
    status = fields.Selection(
        [
            ("not_resolved", "Not Resolved"),
            ("in_progress", "In Progress"),
            ("resolved", "Resolved")
        ],
        string = "Status",
        store = True,
        default = "not_resolved"
    )

    created_at = fields.Date(
        string='Created At',
        store=True,
        default=datetime.today()
    )

    staff_id = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string='Staff',
        default=lambda self: self._default_staff_id(),
        store=True
    )

    resolved_date = fields.Date(
        compute = "_compute_get_date",
        string = "Resolved Date",
        store=True
    )

    is_editable = fields.Boolean(
        compute="_compute_is_editable", 
        string="Is Editable", 
        store=False
    )
        
    resolved_date = fields.Date(
        compute = "_compute_get_date",
        string = "Resolved Date",
        store=True
    )

    @api.model
    def _default_staff_id(self):
        current_user = self.env.user

        staff = self.env['cpm_odoo.human_res_staff'].sudo().search([
            ('user_id', '=', current_user.id)
        ], limit=1)

        return staff.id if staff else False
    
    def action_view(self):
        self.ensure_one()
        
        view_id = self.env.ref("cpm_odoo.issue_select_view_form").id

        return {
            'type': 'ir.actions.act_window',
            'name': 'Issue',
            'res_model': 'cpm_odoo.risk_mgmt_issue',
            'view_mode': 'form',
            'view_id': view_id,
            'target': 'current',
            'res_id': self.id
        }

    def action_in_progress(self):
        for record in self:
            record.status = "in_progress"

    def action_resolved(self):
        for record in self:
            record.status = "resolved"

    def unlink(self):
        if self.status != "not_resolved":
            raise ValidationError("You cannot delete issue with resolved or in progress status")
        return super(Issue, self).unlink()
    
    def write(self, vals):
        for record in self:
            if record.status != 'not_resolved' and self.env.user.has_group('cpm_gr.user_issues'):
                raise ValidationError("You cannot edit issue with resolved or in progress status.")
        return super().write(vals)
    
    @api.depends('status')
    def _compute_is_editable(self):
        for record in self:
            record.is_editable = self.env.user.has_group('cpm_gr.user_issues')

    @api.depends('status')
    def _compute_get_date(self):
        for record in self:
            if record.status == 'resolved':
                record.resolved_date = datetime.today()
            else:
                record.resolved_date = False
                
                
    @api.model
    def act_create_staff_leave(self,task_id):
        task_rec =  self.env["cpm_odoo.planning_task"].sudo().browse(task_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().find_staff_by_user_id(self.env.user.id)
        if task_rec and staff_rec:
            result = {
                'type': 'ir.actions.act_window',
                'view_mode': 'form',
                'name': 'Create Staff Leave',
                'res_model': 'cpm_odoo.risk_mgmt_issue',
                # 'domain': [],
                'view_id':self.env.ref("cpm_odoo.issue_staff_leave_form").id,
                'views':[(self.env.ref("cpm_odoo.issue_staff_leave_form").id,'form')],
                'context': {
                    'default_title':f"{staff_rec['name']} Leave",
                    'default_description':f"{staff_rec['name']} leave from date ___ to ___ on task {task_rec.name}",
                    'default_staff_id':staff_rec['id'],
                    'default_level':'minor',
                    'default_category_id':self.env.ref("cpm_iss_cat.hr_issues").id
                },
                'target': 'new'
            }
            
            return result
        else:
            raise ValidationError("Cannot")
            return False


class IssueCategory(models.Model):
    _name = "cpm_odoo.risk_mgmt_issue_category"
    _description = "Model"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )