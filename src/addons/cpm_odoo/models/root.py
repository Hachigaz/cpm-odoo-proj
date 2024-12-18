from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json


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
            record.current_budget = record.total_investments - record.total_expenses
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
        "cpm_odoo.root_project_planning":"proj_planning_id",
        "cpm_odoo.root_project_finance":"proj_finance_id",
        "cpm_odoo.root_project_doc_mgmt":"proj_doc_id"
    }
    
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
    
    proj_mgmt_group_id2 = fields.Many2one(
        comodel_name = 'res.groups', 
        string='proj_mgmt_group2',
        readonly=True,
        ondelete="restrict"
    )
    
    proj_mem_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='proj_mem_group',
        readonly=True,
        ondelete="restrict"
    )
    
    
    def add_staff_to_mgmt(self,staff_id):
        staff_rec = self.env["cpm_odoo.human_res_staff"].browse(staff_id)
        for record in self:
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[4,record.proj_mgmt_group_id.id]]
            })
    
    def rem_staff_from_mgmt(self,staff_id):
        staff_rec = self.env["cpm_odoo.human_res_staff"].browse(staff_id)
        for record in self:
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[3,record.proj_mgmt_group_id.id]]
            })
    
    def add_staff_to_mem(self,staff_id):
        for record in self:
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[4,record.proj_mem_group_id.id]]
            })
    
    def rem_staff_from_mem(self,staff_id):
        for record in self:
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[3,record.proj_mem_group_id.id]]
            })
        
    
    
    head_mgmt_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='head_mgmt_group',
        readonly=True,
        ondelete="restrict"
    )
    
    head_manager_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='head_manager',
        relation='proj_head_managers_tab',
        column1="pid",
        column2="sid"
    )
    
    finance_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='finance_group_id',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model
    def act_get_finance_managers(self,project_id,domain=[],cols=[],offset=0,count=0,order=""):
        proj_rec = self.env["cpm_odoo.root_project"].browse(project_id)
        proj_rec = proj_rec.sudo()
        uids = [user.id for user in proj_rec.finance_group_id.sudo().users if user not in proj_rec.head_mgmt_group_id.sudo().users]
        staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            domain + [['user_id','in',uids]],
            cols,
            offset,
            count,
            order
        )
        
        return staff_recs
    
    @api.model
    def act_add_finance_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[4,record.finance_group_id.id]]
        })
        pass
    
    @api.model
    def act_remove_finance_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[3,record.finance_group_id.id]]
        })
        return True
        pass
    
    planning_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='planning_group_id',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model
    def act_get_planning_managers(self,project_id,domain=[],cols=[],offset=0,count=0,order=""):
        proj_rec = self.env["cpm_odoo.root_project"].browse(project_id)
        proj_rec = proj_rec.sudo()
        uids = [user.id for user in proj_rec.planning_group_id.sudo().users if user not in proj_rec.head_mgmt_group_id.sudo().users]
        staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            domain + [['user_id','in',uids]],
            cols,
            offset,
            count,
            order
        )
        
        return staff_recs
    
    @api.model
    def act_add_planning_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[4,record.planning_group_id.id]]
        })
        pass
    
    @api.model
    def act_remove_planning_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[3,record.planning_group_id.id]]
        })
        return True
        pass
    
    document_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='document_group_id',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model
    def act_get_document_managers(self,project_id,domain=[],cols=[],offset=0,count=0,order=""):
        proj_rec = self.env["cpm_odoo.root_project"].browse(project_id)
        proj_rec = proj_rec.sudo()
        uids = [user.id for user in proj_rec.document_group_id.sudo().users if user not in proj_rec.head_mgmt_group_id.sudo().users]
        staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            domain + [['user_id','in',uids]],
            cols,
            offset,
            count,
            order
        )
        
        return staff_recs
    
    @api.model
    def act_add_document_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[4,record.document_group_id.id]]
        })
        pass
    
    @api.model
    def act_remove_document_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[3,record.document_group_id.id]]
        })
        return True
        pass
    
    contract_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='contract_group_id',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model
    def act_get_contract_managers(self,project_id,domain=[],cols=[],offset=0,count=0,order=""):
        proj_rec = self.env["cpm_odoo.root_project"].browse(project_id)
        proj_rec = proj_rec.sudo()
        uids = [user.id for user in proj_rec.contract_group_id.sudo().users if user not in proj_rec.head_mgmt_group_id.sudo().users]
        staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            domain + [['user_id','in',uids]],
            cols,
            offset,
            count,
            order
        )
        
        return staff_recs
    
    @api.model
    def act_add_contract_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[4,record.contract_group_id.id]]
        })
        pass
    
    @api.model
    def act_remove_contract_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[3,record.contract_group_id.id]]
        })
        return True
        pass
    
    risk_issue_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='risk_issue_group_id',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model
    def act_get_risk_issue_managers(self,project_id,domain=[],cols=[],offset=0,count=0,order=""):
        proj_rec = self.env["cpm_odoo.root_project"].browse(project_id)
        proj_rec = proj_rec.sudo()
        uids = [user.id for user in proj_rec.risk_issue_group_id.sudo().users if user not in proj_rec.head_mgmt_group_id.sudo().users]
        staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            domain + [['user_id','in',uids]],
            cols,
            offset,
            count,
            order
        )
        
        return staff_recs
    
    @api.model
    def act_add_risk_issue_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[4,record.risk_issue_group_id.id]]
        })
        pass
    
    @api.model
    def act_remove_risk_issue_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[3,record.risk_issue_group_id.id]]
        })
        return True
        pass
    
    
    qa_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='qa_group_id',
        readonly=True,
        ondelete="restrict"
    )
    
    @api.model
    def act_get_qa_managers(self,project_id,domain=[],cols=[],offset=0,count=0,order=""):
        proj_rec = self.env["cpm_odoo.root_project"].browse(project_id)
        proj_rec = proj_rec.sudo()
        uids = [user.id for user in proj_rec.qa_group_id.sudo().users if user not in proj_rec.head_mgmt_group_id.sudo().users]
        staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().search_read(
            domain + [['user_id','in',uids]],
            cols,
            offset,
            count,
            order
        )
        
        return staff_recs
    
    @api.model
    def act_add_qa_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[4,record.qa_group_id.id]]
        })
        pass
    
    @api.model
    def act_remove_qa_manager(self,project_id,staff_id):
        record = self.env["cpm_odoo.root_project"].browse(project_id)
        staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
        staff_rec.write({
            'groups_id':[[3,record.qa_group_id.id]]
        })
        return True
        pass
        
    def add_head_manager(self,staff_id):
        for record in self:
            record.write({
                'head_manager_ids':[(4,staff_id)]
            })
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[4,record.head_mgmt_group_id.id]]
            })
        pass
    
    def rem_head_manager(self,staff_id):
        for record in self:
            record.write({
                'head_manager_ids':[(3,staff_id)]
            })
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[3,record.head_mgmt_group_id.id]]
            })
        pass
    
    @api.model
    def get_model_view_id(self,view_id,xml_id=True):
        if xml_id:
            return self.env.ref(view_id).id
        else:
            return self.env["res.views"].sudo().search([['name','=',view_id]]).id
        
    def get_user_mgmt_groups(self,user_id):
        user_rec = self.env["res.users"].sudo().browse(user_id)
        user_rec = user_rec.sudo()
        for record in self:
            result = {}
            if record.head_mgmt_group_id.id in user_rec.sudo().groups_id.ids:
                result['finance_group_id']=True
                result['planning_group_id']=True
                result['document_group_id']=True
                result['contract_group_id']=True
                result['qa_group_id']=True
                result['risk_issue_group_id']=True
                result['head_mgmt_group_id'] = True
            else:
                result['finance_group_id']=True if record.finance_group_id.id in user_rec.sudo().groups_id.ids else False
                result['planning_group_id']=True if record.planning_group_id.id in user_rec.sudo().groups_id.ids else False
                result['document_group_id']=True if record.document_group_id.id in user_rec.sudo().groups_id.ids else False
                result['contract_group_id']=True if record.contract_group_id.id in user_rec.sudo().groups_id.ids else False
                result['qa_group_id']=True if record.qa_group_id.id in user_rec.sudo().groups_id.ids else False
                result['risk_issue_group_id']=True if record.risk_issue_group_id.id in user_rec.sudo().groups_id.ids else False
                result['head_mgmt_group_id'] = False
            return result
        
    @api.model_create_multi
    def create(self, vals):
        records = super().create(vals)
        for record in records:
            record = record.sudo()
            # record.proj_hrm_id.project_id = record.id
            record.proj_planning_id.project_id = record.id
            record.proj_finance_id.project_id = record.id
            record.proj_doc_id.project_id = record.id
            
            
            mgmt_gr_rec2 = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Mgmt Group {record.id}",
                "implied_ids":[self.env.ref("cpm_gr.project_mgmt_gr").id],
                "comment":f"Project Management Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.proj_mgmt_group_id2 = mgmt_gr_rec2.id
            
            mgmt_gr_rec = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Manager Mgmt Group {record.id}",
                "implied_ids":[mgmt_gr_rec2.id],
                "comment":f"Project Manager Management Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.proj_mgmt_group_id = mgmt_gr_rec.id
            
            mem_gr_rec = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Member Group {record.id}",
                "implied_ids":[self.env.ref("cpm_gr.project_mem_gr").id],
                "comment":f"Project Member Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.proj_mem_group_id = mem_gr_rec.id
            
            head_mgmt_gr_rec = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Head Manager Group {record.id}",
                "implied_ids":[self.env.ref("cpm_gr.project_head_manager").id,mgmt_gr_rec2.id],
                "comment":f"Project Head Manager Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.head_mgmt_group_id = head_mgmt_gr_rec.id
            
            #docmuent group
            document_group_id = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Document Group {record.id}",
                "implied_ids":[mgmt_gr_rec.id],
                "comment":f"Project Document Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.document_group_id = document_group_id.id
            
            #contract group
            contract_group_id = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Contract Group {record.id}",
                "implied_ids":[mgmt_gr_rec.id],
                "comment":f"Project Contract Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.contract_group_id = contract_group_id.id
            
            #finance group
            finance_group_id = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Finance Group {record.id}",
                "implied_ids":[mgmt_gr_rec.id],
                "comment":f"Project Finance Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.finance_group_id = finance_group_id.id
            
            #planning group
            planning_group_id = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Planning Group {record.id}",
                "implied_ids":[mgmt_gr_rec.id,contract_group_id.id,document_group_id.id],
                "comment":f"Project Planning Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.planning_group_id = planning_group_id.id
            
            #qa group
            qa_group_id = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project QA Group {record.id}",
                "implied_ids":[mgmt_gr_rec.id],
                "comment":f"Project QA Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.qa_group_id = qa_group_id.id
            
            #risk_issue group
            risk_issue_group_id = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Project Risk Issue Group {record.id}",
                "implied_ids":[mgmt_gr_rec.id],
                "comment":f"Project Risk Issue Group {record.short_name}",
                "category_id":self.env.ref("cpm_gr_cat.cpm_groups").id
            })
            
            record.risk_issue_group_id = risk_issue_group_id.id
            
            record.add_head_manager(self.env["cpm_odoo.human_res_staff"].search(["&",["user_id",'=',self.env.user.id],"|",['active','=',True],['active','=',False]]).id)
            for user in record.head_manager_ids:
                record.add_head_manager(user.id)
        return records
    
    def write(self, vals):
        for rec in self:
            staff_ids = vals.get('head_manager_ids')
            if staff_ids:
                added_ids = [rec[1] for rec in staff_ids if rec[0] == 4]
                deleted_ids = [rec[1] for rec in staff_ids if rec[0] == 3]
                
                add_staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().browse(added_ids)
                del_staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().browse(deleted_ids)
                
                for srec in add_staff_recs:
                    srec.write({
                        'groups_id':[(4,rec.head_mgmt_group_id.id)]
                    })
                    
                for srec in del_staff_recs:
                    srec.write({
                        'groups_id':[(3,rec.head_mgmt_group_id.id)]
                    })
        return super().write(vals)
    
    def unlink(self):
        for record in self:
            record.proj_mgmt_group_id.unlink()
            record.proj_mem_group_id.unlink()
            for rule in record.rule_ids:
                rule.unlink()
        return super().unlink()