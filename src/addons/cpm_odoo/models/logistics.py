from odoo import models, fields, api

class Mat_ImportRecord(models.Model):
    _name = 'cpm_odoo.logistics_mat_imp_rec'
    _description = 'model.technical.name'
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']
    

class Eqp_ImportRecord(models.Model):
    _name = 'cpm_odoo.logistics_eqp_imp_rec'
    _description = 'model.technical.name'
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']
    

class Mat_ExportRecord(models.Model):
    _name = 'cpm_odoo.logistics_mat_exp_rec'
    _description = 'model.technical.name'
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']
    

class Eqp_ExportRecord(models.Model):
    _name = 'cpm_odoo.logistics_eqp_exp_rec'
    _description = 'model.technical.name'
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']