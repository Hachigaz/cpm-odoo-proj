from odoo import models, fields, api
from odoo.exceptions import ValidationError


class InvestmentRecord(models.Model):
    _name = 'cpm_odoo.finance_investment_record'
    _description = "Investment Record"
    
    project_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='project_investment',
        required=True,
        ondelete = 'cascade'
    )
    
    investor_id = fields.Many2one(
        comodel_name ='cpm_odoo.stakeholders_investor', 
        string='Investor',
        required=True,
        ondelete='restrict'
    )
    
    status = fields.Selection([
            ('pending', 'pending'),
            ('processed', 'Processed')
        ], 
        string='status',
        default="pending"
    )
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency',
        required=True,
        default=lambda self: self._get_vnd_currency_id()
    )
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for record in self:
            if record.amount <= 0:
                raise ValidationError("Investment amount must be positive.")
        pass

    def _get_vnd_currency_id(self):
        vnd_currency = self.env['res.currency'].search([('name', '=', 'VND')], limit=1)
        return vnd_currency.id if vnd_currency else self.env.user.company_id.currency_id.id
    
    amount = fields.Monetary(
        string = 'Amount',
        required=True,
        currency_field = 'cur_id'
    )
    
    date_created = fields.Datetime(
        'Date Created',
        default = fields.Datetime.now(),
        required=True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string='Created By'
    )
    
    def act_process_transaction(self):
        for record in self:
            record.status='processed'
    
class ExpenseRecord(models.Model):
    _name = 'cpm_odoo.finance_expense_record'
    _description = "Expense Record"
    
    project_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='project_investment',
        required=True,
        ondelete = 'cascade'
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.finance_expense_category', 
        string='category'
    )
    
    status = fields.Selection([
            ('pending', 'Pending'),
            ('paid', 'Paid')
        ], 
        string='status',
        default="pending"
    )
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency',
        required=True,
        default=lambda self: self._get_vnd_currency_id()
    )

    def _get_vnd_currency_id(self):
        vnd_currency = self.env['res.currency'].search([('name', '=', 'VND')], limit=1)
        return vnd_currency.id if vnd_currency else self.env.user.company_id.currency_id.id
    
    amount = fields.Monetary(
        string = 'Amount',
        required=True,
        currency_field = 'cur_id'
    )
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for record in self:
            if record.amount <= 0:
                raise ValidationError("Expense amount must be positive.")
        pass
    
    date_created = fields.Datetime(
        string = 'Date Created',
        default = fields.Datetime.now(),
        required = True
    )
    
    is_urgent = fields.Boolean(
        string ='is_urgent',
        default = False
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string = 'Created By'
    )
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            staff = self.env["cpm_odoo.human_res_staff"].search([('user_id', '=', self.env.user.id)], limit=1)
            if(len(staff)>0):
                val["created_by"] = staff.id
        return super().create(vals)
    
    def act_process_transaction(self):
        for record in self:
            record.status='paid'
    
class ExpenseCategory(models.Model):
    _name = 'cpm_odoo.finance_expense_category'
    _description = "Expense Category"
    # _rec_name = "encoded_name"
    
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
    
    display = fields.Boolean(
        string = 'Display',
        required=True,
        default=False
    )
    
    # encoded_name = fields.Char(
    #     compute='_compute_encoded_name', 
    #     string='encoded_name',
    #     store=True
    # )
    
    # @api.depends('name','color')
    # def _compute_encoded_name(self):
    #     for record in self:    
    #         record.encoded_name = json.dumps({
    #             "name":record.name,
    #             "color":record.color
    #         })
    #     pass