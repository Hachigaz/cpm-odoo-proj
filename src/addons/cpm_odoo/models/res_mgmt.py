from odoo import models, fields, api

class Equipment(models.Model):
    _name = 'cpm_odoo.res_mgmt_equipment'
    _description = ''
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    eqp_type_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_eqp_type', 
        string='Equipment Type',
        ondelete= 'restrict',
        required=True
    )
    
class EquipmentType(models.Model):
    _name = 'cpm_odoo.res_mgmt_eqp_type'
    _description = ''

    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    

class Material(models.Model):
    _name = 'cpm_odoo.res_mgmt_material'
    _description = ''
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    eqp_type_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_mat_type', 
        string='Material Type',
        ondelete= 'restrict',
        required=True
    )
    
    supplier_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_supplier', 
        string='Supplier',
        required = True,
        ondelete = 'restrict'
    )
    
class MaterialType(models.Model):
    _name = 'cpm_odoo.res_mgmt_mat_type'
    _description = ''

    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )

class Mat_Res_Record(models.AbstractModel):
    _name = 'cpm_odoo.res_mgmt_mat_res_rec'
    _description = ''
    
    material_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_material', 
        string='Material',
        required=True,
        ondelete='restrict'
    )
    
    amount = fields.Float(
        string = 'Amount',
        default = 0.0
    )
    
class Eqp_Res_Record(models.AbstractModel):
    _name = 'cpm_odoo.res_mgmt_eqp_res_rec'
    _description = ''
    
    equipment_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_equipment', 
        string='Equipment',
        required=True,
        ondelete='restrict'
    )
    
    amount = fields.Integer(
        string = 'Amount',
        default = 0
    )
    
    
    
class WarehouseInfo(models.Model):
    _name = 'cpm_odoo.res_mgmt_warehouse_info'
    _description = 'model.technical.name'
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    address  = fields.Char(
        string = 'Address',
        size = 1024
    )
    
class Mat_StorageRecord(models.Model):
    _name = 'cpm_odoo.res_mgmt_mat_storage_rec'
    _description = ''
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )    
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']

    
class Eqp_StorageRecord(models.Model):
    _name = 'cpm_odoo.res_mgmt_eqp_storage_rec'
    _description = ''
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']