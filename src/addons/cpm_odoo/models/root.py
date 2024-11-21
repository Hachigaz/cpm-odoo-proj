from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json

# class ProjectHRM(models.Model):
#     _name = "cpm_odoo.root_project_hrm"
#     _description = "Project HRM"
    
#     project_id = fields.Many2one(
#         comodel_name = 'cpm_odoo.root_project', 
#         string='Project',
#         ondelete="cascade"
#     )
    
#     project_staff_ids = fields.Many2many(
#         comodel_name = 'cpm_odoo.human_res_staff', 
#         string='Staffs',
#         relation = "project_assigned_staffs",
#         column1 = "hrm_id",
#         column2 = "staff_id"
#     )
    
#     # @api.onchange("project_staff_ids")
#     # def _onchange_staff_ids(self):
#     #     current_ids = self.project_staff_ids.ids
#     #     previous_ids = self.env['cpm_odoo.human_res_staff'].browse(self.id).project_staff_ids.ids
        
#     #     # added_ids = set(current_ids) - set(previous_ids)
#     #     # if added_ids:
#     #     #     pass
        
        
#     #     removed_ids = set(previous_ids) - set(current_ids)
#     #     if removed_ids:
#     #         for id in removed_ids:
#     #             if(self.env["cpm_odoo.planning_task"].)
#     #         pass
    
#     # assigned_accountant_ids = fields.Many2many(
#     #     comodel_name = 'cpm_odoo.human_res_staff',
#     #     string='Assigned Accountants'
#     # )
    
#     # assigned_qcs = fields.Many2many(
#     #     comodel_name = 'cpm_odoo.human_res_staff', 
#     #     string='assigned_qcs'
#     # )
    
#     def name_get(self, cr, user, ids, context=None):
#         result = []
#         for record in self:
#             result.append((record.project_id.short_name))
#         return result


class ProjectPlanning(models.Model):
    _name = "cpm_odoo.root_project_planning"
    _description = "Project Planning"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project',
        ondelete="cascade"
    )
    
    workflow_ids = fields.One2many(
        comodel_name = 'cpm_odoo.planning_workflow', 
        inverse_name = 'planning_id',
        string='Workflows'
    )
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result

class FinanceInvestorRecord(models.Model):
    _name = "cpm_odoo.project_investor_investment_record"
    _description = "Model"
    
    project_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='project_finance',
        ondelete='cascade',
        required=True
    )

    investor_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_investor', 
        string='investor',
        ondelete ='restrict',
        required=True
    )
    
    cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency',
        required=True,
        default=lambda self: self._get_vnd_currency_id(),
        readonly=True
    )

    def _get_vnd_currency_id(self):
        vnd_currency = self.env['res.currency'].search([('name', '=', 'VND')], limit=1)
        return vnd_currency.id if vnd_currency else self.env.user.company_id.currency_id.id
    
    total_investments = fields.Monetary(
        currency_field = 'cur_id',
        string='total_investments',
        default = 0,
        readonly=True
    )

class FinanceCategoryRecord(models.Model):
    _name = "cpm_odoo.project_category_expense_record"
    _description = "Model"
    
    project_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='project_finance',
        ondelete='cascade',
        required=True
    )

    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.finance_expense_category', 
        string='category',
        ondelete ='restrict'
    )
    
    cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency',
        required=True,
        default=lambda self: self._get_vnd_currency_id(),
        readonly=True
    )

    def _get_vnd_currency_id(self):
        vnd_currency = self.env['res.currency'].search([('name', '=', 'VND')], limit=1)
        return vnd_currency.id if vnd_currency else self.env.user.company_id.currency_id.id
    
    total_expenses = fields.Monetary(
        currency_field = 'cur_id',
        string='total_expenses',
        default = 0,
        readonly=True
    )
    
class ProjectFinance(models.Model):
    _name = "cpm_odoo.root_project_finance"
    _description = "Model"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project',
        ondelete="cascade"
    )
    
    investment_record_ids = fields.One2many(
        comodel_name = 'cpm_odoo.finance_investment_record', 
        inverse_name = 'project_finance_id', 
        string='Investments'
    )
    
    expense_record_ids = fields.One2many(
        comodel_name = 'cpm_odoo.finance_expense_record', 
        inverse_name = 'project_finance_id', 
        string='Expenses'
    )
    
    cur_id = fields.Many2one(
        comodel_name = 'res.currency', 
        string='Currency',
        required=True,
        default=lambda self: self._get_vnd_currency_id(),
        readonly=True
    )

    def _get_vnd_currency_id(self):
        vnd_currency = self.env['res.currency'].search([('name', '=', 'VND')], limit=1)
        return vnd_currency.id if vnd_currency else self.env.user.company_id.currency_id.id
    
    total_investments = fields.Monetary(
        currency_field = 'cur_id',
        compute='_compute_total_investments', 
        string='total_investments',
        store=True
    )
    
    @api.depends('investment_record_ids')
    def _compute_total_investments(self):
        for record in self:
            record.total_investments = 0
            for cat_rec in record.investment_record_ids:
                if(cat_rec.cur_id.name=="VND"):
                    record.total_investments += cat_rec.amount
                else:
                    record.total_investments += cat_rec.cur_id._convert(
                        cat_rec.amount,
                        record.cur_id,
                        self.env.company,
                        fields.Date.today()
                    )
        pass
    
    total_expenses = fields.Monetary(
        required=True,
        currency_field = 'cur_id',
        compute='_compute_total_expenses', 
        string='total_expenses'
    )
    
    @api.depends('expense_record_ids')
    def _compute_total_expenses(self):
        for record in self:
            record.total_expenses = 0
            for exp_rec in record.expense_record_ids:
                if(exp_rec.cur_id.name=="VND"):
                    record.total_expenses += exp_rec.amount
                else:
                    record.total_expenses += exp_rec.cur_id._convert(
                        exp_rec.amount,
                        record.cur_id,
                        self.env.company,
                        fields.Date.today()
                    )
        pass
    
    current_budget = fields.Char(compute='_compute_current_budget', string='current_budget')
    
    @api.depends('total_investments','total_expenses')
    def _compute_current_budget(self):
        for record in self:
            record.current_budget = total_investments - total_expenses
        pass
    
    
    
    investor_investment_records = fields.One2many(
        comodel_name = "cpm_odoo.project_investor_investment_record",
        inverse_name = "project_finance_id",
        compute='_compute_investor_investment_records', 
        string='investor_investment_records',
        store=True
    )
    
    @api.depends('investment_record_ids')
    def _compute_investor_investment_records(self):
        for record in self:
            record.investor_investment_records = self.env['cpm_odoo.project_investor_investment_record'].search([
                ('project_finance_id', '=', record.id)
            ])
            for rec in record.investor_investment_records:
                rec.unlink()
            
            for rec in record.investment_record_ids:
                investor_rec = next((cat_rec for cat_rec in record.investor_investment_records if rec.investor_id == cat_rec.investor_id),None)
                if investor_rec:
                    if(rec.cur_id.name=="VND"):
                        investor_rec.total_investments += rec.amount
                    else:
                        investor_rec.total_investments += rec.cur_id._convert(
                        rec.amount,
                        investor_rec.cur_id,
                        self.env.company,
                        fields.Date.today()
                    )
                else:
                    investor_rec = self.env["cpm_odoo.project_investor_investment_record"].create({
                        'project_finance_id':record.id,
                        'investor_id':rec.investor_id.id
                    })
                    if(rec.cur_id.name=="VND"):
                        investor_rec.total_investments += rec.amount
                    else:
                        investor_rec.total_investments += rec.cur_id._convert(
                        rec.amount,
                        investor_rec.cur_id,
                        self.env.company,
                        fields.Date.today()
                    )
        pass
    
    
    category_expense_records = fields.One2many(
        comodel_name = "cpm_odoo.project_category_expense_record",
        inverse_name = "project_finance_id",
        compute='_compute_category_expense_records', 
        string='category_expense_records',
        store=True
    )
    
    @api.depends('expense_record_ids')
    def _compute_category_expense_records(self):
        for record in self:
            record.category_expense_records = self.env['cpm_odoo.project_category_expense_record'].search([
                ('project_finance_id', '=', record.id)
            ])
            for rec in record.category_expense_records:
                rec.unlink()
            
            for rec in record.expense_record_ids:
                category_rec = next((cat_rec for cat_rec in record.category_expense_records if rec.category_id == cat_rec.category_id),None)
                if category_rec:
                    if(rec.cur_id.name=="VND"):
                        category_rec.total_expenses += rec.amount
                    else:
                        category_rec.total_expenses += rec.cur_id._convert(
                        rec.amount,
                        category_rec.cur_id,
                        self.env.company,
                        fields.Date.today()
                    )
                else:
                    category_rec = self.env["cpm_odoo.project_category_expense_record"].create({
                        'project_finance_id':record.id,
                        'category_id':rec.category_id.id
                    })
                    if(rec.cur_id.name=="VND"):
                        category_rec.total_expenses += rec.amount
                    else:
                        category_rec.total_expenses += rec.cur_id._convert(
                        rec.amount,
                        category_rec.cur_id,
                        self.env.company,
                        fields.Date.today()
                    )
        pass
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result
    
    
    def unlink(self):
        for record in self:
            for investor_rec in record.investor_investment_records:
                investor_rec.unlink()
        return super().unlink()

class ProjectDocMgmt(models.Model):
    _name = "cpm_odoo.root_project_doc_mgmt"
    _description = "Model"
    
    project_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project', 
        string='Project',
        ondelete="cascade"
    )
    
    attached_document_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.documents_document_set', 
        string='Attached Documents',
        relation = 'cpm_odoo_proj_doc_mgmt_doc_set'
    )
    
    def name_get(self, cr, user, ids, context=None):
        result = []
        for record in self:
            result.append((record.project_id.short_name))
        return result

class Project(models.Model):
    _name = "cpm_odoo.root_project"
    _description = "Model"
    
    short_name = fields.Char(
        string = 'Short Name (64)',
        required=True,
        size = 64
    )
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 512
    )

    description = fields.Text(
        string = 'Description'
    )
    
    start_date = fields.Date(
        string = 'Start Date',
        required=True,
        default = fields.Date.today()
    )
    
    exp_end = fields.Date(
        string = 'Expected End Date'
    )
    
    investor_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_investor', 
        string='Investors',
        relation = 'cpm_odoo_root_proj_stk_investor',
    )
    
    other_contact_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_other_contacts', 
        string='Other Contacts',
        relation = 'cpm_odoo_root_proj_stk_other_contact',
    )
    
    _inherits = {
        # "cpm_odoo.root_project_hrm":"proj_hrm_id",
        "cpm_odoo.root_project_planning":"proj_planning_id",
        "cpm_odoo.root_project_finance":"proj_finance_id",
        "cpm_odoo.root_project_doc_mgmt":"proj_doc_id"
    }
    
    # proj_hrm_id = fields.Many2one(
    #     comodel_name = 'cpm_odoo.root_project_hrm', 
    #     string='HRM Management',
    #     readonly=True,
    #     required = True,
    #     ondelete = 'restrict'
    # )
    
    proj_planning_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_planning', 
        string='Planning',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    proj_finance_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_finance', 
        string='Finance',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    proj_doc_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_doc_mgmt', 
        string='Documents',
        readonly=True,
        required = True,
        ondelete = 'restrict'
    )
    
    proj_mgmt_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='proj_mgmt_group',
        readonly=True,
        ondelete="restrict"
    )
    
    proj_mem_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='proj_mem_group',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model_create_multi
    def create(self, vals):
        # raise ValidationError(json.dumps([group.name for group in self.env.user.groups_id]))
        records = super().create(vals)
        for record in records:
            # record.proj_hrm_id.project_id = record.id
            record.proj_planning_id.project_id = record.id
            record.proj_finance_id.project_id = record.id
            record.proj_doc_id.project_id = record.id
            
            
            mgmt_gr_rec = self.env["res.groups"].create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Mgmt Group {record.id}",
                "implied_ids":[self.env.ref("cpm_gr.project_mgmt_gr").id],
                "comment":f"Project Management Group {record.short_name}"
            })
            
            record.proj_mgmt_group_id = mgmt_gr_rec.id
            
            mem_gr_rec = self.env["res.groups"].create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Member Group {record.id}",
                "implied_ids":[self.env.ref("cpm_gr.project_mem_gr").id],
                "comment":f"Project Member Group {record.short_name}"
            })
            
            record.proj_mem_group_id = mem_gr_rec.id
            
            cur_user = self.env.user
            cur_user.write({
                'groups_id': [(4,mgmt_gr_rec.id),(4,mem_gr_rec.id)]
            })
            mgmt_gr_rec.write({
                "users":[(4,cur_user.id)]
            })
            mem_gr_rec.write({
                "users":[(4,cur_user.id)]
            })
        return records
    
    def unlink(self):
        for record in self:
            record.proj_mgmt_group_id.unlink()
            record.proj_mem_group_id.unlink()
            for rule in record.rule_ids:
                rule.unlink()
        return super().unlink()
    
    
    
    is_manager = fields.Boolean(
        string="Is Manager",
        compute="_compute_is_manager",
        store=False
    )

    @api.depends('is_manager')
    def _compute_is_manager(self):
        for record in self:
            record.is_manager = self.env.user.has_group(record.proj_mgmt_group_id)


    is_member = fields.Boolean(
        string="Is Member",
        compute="_compute_is_member",
        store=False
    )

    @api.depends('is_member')
    def _compute_is_member(self):
        for record in self:
            record.is_manager = self.env.user.has_group(record.proj_mem_group_id)