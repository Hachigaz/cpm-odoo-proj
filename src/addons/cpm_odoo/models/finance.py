from odoo import models, fields, api

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
    
    amount_cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency'
    )
    
    amount = fields.Monetary(
        string = 'Amount',
        required=True,
        currency_field = 'amount_cur_id'
    )
    
    date_created = fields.Datetime(
        'Date Created',
        default = fields.Datetime.now(),
        required=True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string='Created By',
        required=True
    )
    
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
        string='category',
        readonly=True
    )
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    amount_cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency'
    )
    
    amount = fields.Monetary(
        string = 'Amount',
        required=True,
        currency_field = 'amount_cur_id'
    )
    
    date_created = fields.Datetime(
        string = 'Date Created',
        default = fields.Datetime.now(),
        required = True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string = 'Created By',
        required = True
    )
    
    
class ExpenseCategory(models.Model):
    _name = 'cpm_odoo.finance_expense_category'
    _description = "Expense Category"
    _rec_name = "encoded_name"
    
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
    
    encoded_name = fields.Char(
        compute='_compute_encoded_name', 
        string='encoded_name',
        store=True
    )
    
    @api.depends('name','color')
    def _compute_encoded_name(self):
        for record in self:    
            record.encoded_name = json.dumps({
                "name":record.name,
                "color":record.color
            })
        pass