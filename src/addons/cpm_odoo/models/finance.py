from odoo import models, fields, api

class InvestmentRecord(models.Model):
    _name = 'cpm_odoo.finance_investment_record'
    _description = "Model"
    
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
    _description = "Model"
    
    project_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='project_investment',
        required=True,
        ondelete = 'cascade'
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